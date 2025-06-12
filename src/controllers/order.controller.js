// * online payment using paymob
import {
  getAuthToken,
  createOrder as paymobCreateOrder,
  generatePaymentKey,
  getIframeUrl,
  refundPaymob,
} from "../utils/paymob.js";

import User from "../../db/models/user.model.js";
import Product from "../../db/models/product.model.js";
import Coupon from "../../db/models/coupon.model.js";
import Cart from "../../db/models/cart.model.js";
import Order from "../../db/models/order.model.js";
import sendEmail, { orderDetailsHTMLContent } from "../utils/sendEmail.js";

//^ ------------------------------------------ create order ------------------------------------------

const SHIPPING_PRICE = 50;

export const createOrder = async (req, res) => {
  let { shippingAddress, paymentMethod, couponCode, phone } = req.body;

  try {
    const cart = await Cart.findOne({ userID: req.user.id }).populate(
      "cartItems.productId"
    );
    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // Coupon validation
    let coupon = null;
    let couponDiscountPct = 0;
    if (couponCode) {
      coupon = await Coupon.findOne({ CouponCode: couponCode });
      if (!coupon) return res.status(400).json({ message: "Coupon not found" });
      if (coupon.CouponUsers.includes(req.user.id)) {
        return res.status(400).json({ message: "Coupon already used" });
      }
      couponDiscountPct = coupon.CouponPercentage || 0;
    }

    // Price calculation
    let totalPriceBeforeDiscount = 0;
    for (const item of cart.cartItems) {
      const product = item.productId;
      const discountedPrice =
        product.price * (1 - (product.discount || 0) / 100);
      totalPriceBeforeDiscount += discountedPrice * item.quantity;
    }

    const totalPriceWithShipping =
      totalPriceBeforeDiscount * (1 - couponDiscountPct / 100) + SHIPPING_PRICE;

    const orderItems = cart.cartItems.map((i) => {
      const product = i.productId;
      const discountedPrice =
        product.price * (1 - (product.discount || 0) / 100);
      return {
        productId: product._id,
        quantity: i.quantity,
        priceAtOrder: product.price,
        discountAtOrder: product.discount || 0,
        discountedPriceAtOrder: discountedPrice,
      };
    });

    const order = new Order({
      userID: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      phone,
      couponCode: couponCode || null,
      shippingPrice: SHIPPING_PRICE,
      totalPriceBeforeDiscount,
      totalPriceAfterDiscount: totalPriceWithShipping - SHIPPING_PRICE,
      totalPrice: totalPriceWithShipping,
      orderStatus: "waiting",
      shippingStatus: "pending",
    });

    await order.save();

    const user = await User.findById(req.user.id);
    if (!user.address.includes(shippingAddress)) {
      user.address.push(shippingAddress);
      await user.save();
    }

    if (paymentMethod === "cash") {
      if (couponCode) {
        await Coupon.updateOne(
          { CouponCode: couponCode },
          { $push: { CouponUsers: req.user.id } }
        );
      }

      for (const item of cart.cartItems) {
        const product = item.productId;
        if (product.stock > 0) {
          product.stock -= item.quantity;
          product.orderCount++;
          await product.save();
        }
      }

      await sendEmail(
        user.email,
        "Your Order Invoice",
        orderDetailsHTMLContent,
        {
          cartItems: cart.cartItems,
          totalPrice: totalPriceWithShipping,
          createdAt: order.createdAt,
          _id: order._id,
        }
      );

      cart.cartItems = [];
      await cart.save();

      return res
        .status(201)
        .json({ message: "Order placed successfully.", data: order });
    }

    //* === Online Payment with Paymob ===
    const billingData = {
      apartment: "NA",
      email: user.email,
      floor: "NA",
      first_name: user.name?.split(" ")[0] || "First",
      last_name: user.name?.split(" ")[1] || "Last",
      phone_number: phone,
      building: "NA",
      city: "Cairo",
      country: "EG",
      state: "NA",
      street: shippingAddress,
    };

    const items = cart.cartItems.map((item) => {
      const product = item.productId;
      const discountedPrice =
        product.price * (1 - (product.discount || 0) / 100);

      return {
        name: product.title,
        amount_cents: Math.round(discountedPrice * 100), // Paymob uses cents
        quantity: item.quantity,
      };
    });

    const authToken = await getAuthToken();
    const paymobOrder = await paymobCreateOrder(
      authToken,
      Math.round(totalPriceWithShipping * 100),
      items,
      order
    );
    const paymentKey = await generatePaymentKey(
      authToken,
      paymobOrder.id,
      Math.round(totalPriceWithShipping * 100),
      billingData
    );
    const iframeUrl = getIframeUrl(paymentKey);

    return res.status(200).json({
      message: "Paymob payment initiated.",
      iframeUrl,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return res
      .status(500)
      .json({ message: "Server error during order creation." });
  }
};

//^ --------------------------------------craete webhook---------------------------------------
export const createWebhook = async (req, res) => {
  const { obj } = req.body;

  if (obj.success && obj.order && obj.order.merchant_order_id) {
    const orderId = obj.order.merchant_order_id;
    const transactionId = obj.id; // Get transaction ID for refund later

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          orderStatus: "paid",
          transactionId: transactionId,
        },
        { new: true }
      );

      if (!updatedOrder)
        return res.status(404).json({ error: "Order not found" });

      if (updatedOrder.couponCode) {
        await Coupon.updateOne(
          { CouponCode: updatedOrder.couponCode },
          { $push: { CouponUsers: updatedOrder.userID } }
        );
      }

      for (const orderItem of updatedOrder.orderItems) {
        const product = await Product.findById(orderItem.productId);
        if (product && product.stock > 0) {
          product.stock -= orderItem.quantity;
          product.orderCount++;
          await product.save();
        }
      }

      const user = await User.findById(updatedOrder.userID);
      const cart = await Cart.findOne({ userID: updatedOrder.userID }).populate(
        "cartItems.productId"
      );

      if (cart) {
        await sendEmail(
          user.email,
          "Your Order Invoice",
          orderDetailsHTMLContent,
          {
            cartItems: cart.cartItems,
            totalPrice: updatedOrder.totalPrice,
            createdAt: updatedOrder.createdAt,
            _id: updatedOrder._id,
          }
        );
        cart.cartItems = [];
        await cart.save();
      }

      return res.status(200).json({
        success: true,
        message: "Order marked as paid",
        received: true,
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // For unsuccessful payments or invalid structure
  return res.status(200).json({ received: true });
};

// ^---------------------------------GET All Orders--------------------------
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 7; // default 7 items per page
    const skip = (page - 1) * limit;
    const total = await Order.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userID", "name email image")
      .populate({
        path: "orderItems.productId",
        select: "title price thumbnail material color orderCount",
      });

    if (orders.length === 0)
      return res.status(200).json({ message: "no orders found" });

    const allOrders = orders.map((order) => {
      const { userID, orderItems, ...rest } = order.toObject();

      const populatedOrderItems = orderItems.map((item) => {
        return {
          _id: item._id,
          product: item.productId, // Populated product data
          quantity: item.quantity,
        };
      });

      return {
        ...rest,
        user: userID,
        orderItems: populatedOrderItems,
      };
    });

    res.status(200).json({
      message: "success",
      data: allOrders,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

// ^----------------------------------GET All User Orders--------------------------
const getUserOrders = async (req, res) => {
  try {
    const userID = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ userID });
    const totalPages = Math.ceil(total / limit);
    const orders = await Order.find({ userID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userID", "name email image")
      .populate({
        path: "orderItems.productId",
        select: "title price thumbnail material color orderCount",
      });

    if (orders.length === 0)
      return res.status(200).json({ message: "no orders found" });

    const allOrders = orders.map((order) => {
      const { userID, orderItems, ...rest } = order.toObject();

      const populatedOrderItems = orderItems.map((item) => {
        return {
          _id: item._id,
          product: item.productId, // Populated product data
          quantity: item.quantity,
        };
      });

      return {
        ...rest,
        user: userID,
        orderItems: populatedOrderItems,
      };
    });

    res.status(200).json({
      message: "success",
      data: allOrders,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

// ^----------------------------------GET Order By ID--------------------------
const getOrderByID = async (req, res) => {
  try {
    const orderID = req.params.id;

    const order = await Order.findById(orderID)
      .populate("userID", "name email image")
      .populate({
        path: "orderItems.productId",
        select: "title price thumbnail material color orderCount",
      });

    if (!order) return res.status(404).json({ message: "order is not found" });

    const { userID, orderItems, ...rest } = order.toObject();

    const populatedOrderItems = orderItems.map((item) => {
      return {
        _id: item._id,
        product: item.productId, // Populated product data
        quantity: item.quantity,
      };
    });

    const orderDetails = {
      ...rest,
      user: userID,
      orderItems: populatedOrderItems,
    };

    res.status(200).json({ message: "success", data: orderDetails });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

// ^----------------------------------PUT Order By ID--------------------------
const updateOrderByID = async (req, res) => {
  try {
    const orderID = req.params.id;

    const { shippingStatus } = req.body;

    const order = await Order.findById(orderID)
      .populate("userID", "name email image")
      .populate({
        path: "orderItems.productId",
        select: "title price thumbnail material color orderCount",
      });

    if (!order) return res.status(404).json({ message: "order is not found" });

    if (shippingStatus === order.shippingStatus)
      return res.status(409).json({
        message: `shipping status is already ${order.shippingStatus}`,
      });

    if (shippingStatus !== "shipped") {
      order.shippingStatus = shippingStatus;
    } else if (shippingStatus === "shipped") {
      order.shippingStatus = shippingStatus;
      order.orderStatus = "paid";
    }

    await order.save();

    const { userID, orderItems, ...rest } = order.toObject();

    const populatedOrderItems = orderItems.map((item) => {
      return {
        _id: item._id,
        product: item.productId, // Populated product data
        quantity: item.quantity,
      };
    });

    const orderDetails = {
      ...rest,
      user: userID,
      orderItems: populatedOrderItems,
    };

    res.status(200).json({ message: "success", data: orderDetails });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};
// ^----------------------------------DELETE Order By ID--------------------------
const deleteOrderByID = async (req, res) => {
  try {
    const orderID = req.params.id;

    const order = await Order.findByIdAndDelete(orderID)
      .populate("userID", "name email image")
      .populate({
        path: "orderItems.productId",
        select: "title price thumbnail material color orderCount",
      });

    if (!order) return res.status(404).json({ message: "order is not found" });

    const { userID, orderItems, ...rest } = order.toObject();

    const populatedOrderItems = orderItems.map((item) => {
      return {
        _id: item._id,
        product: item.productId, // Populated product data
        quantity: item.quantity,
      };
    });

    const orderDetails = {
      ...rest,
      user: userID,
      orderItems: populatedOrderItems,
    };

    res.status(200).json({ message: "success", data: orderDetails });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

//^-------------------------------Get Orders Data in Each Month--------------------------------
const getOrdersByMonth = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    let ordersByMonth = await Order.aggregate([
      //* 1 Match orders within the specified year
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },

      //* 2 Group by month and year
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },

      //* 3: Sort by month in ascending order
      { $sort: { "_id.month": 1 } },
    ]);

    if (!ordersByMonth.length) {
      return res.status(200).json({ message: "No orders found for this year" });
    }

    ordersByMonth = ordersByMonth.map((order) => {
      const { _id, ...rest } = order;

      return {
        ...rest,
        month: _id.month,
      };
    });

    res.status(200).json({ message: "success", data: ordersByMonth });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ^----------------------------------Cancel Order--------------------------
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // 2. Check if it's within 14 days
    const now = new Date();
    const orderDate = new Date(order.createdAt);
    const daysPassed = (now - orderDate) / (1000 * 60 * 60 * 24);

    if (daysPassed > 14) {
      return res
        .status(400)
        .json({ message: "Refund period has expired (14 days)." });
    }

    // 3. Handle refund logic
    if (order.paymentMethod === "online") {
      // Call Paymob Refund API (you’ll need the transaction ID)
      const refundResponse = await refundPaymob(
        order.transactionId,
        order.totalPrice
      );
      if (!refundResponse.success) {
        return res
          .status(500)
          .json({ message: "Refund failed", details: refundResponse.error });
      }
    }

    // 4. Update order status
    order.orderStatus = "cancelled";
    order.shippingStatus = "cancelled";
    await order.save();

    return res.status(200).json({
      message:
        "Order cancelled and refunded if paid online or you will be contacted if paid cash",
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  getAllOrders,
  getUserOrders,
  getOrderByID,
  updateOrderByID,
  deleteOrderByID,
  createOrder,
  createWebhook,
  getOrdersByMonth,
  cancelOrder,
};
