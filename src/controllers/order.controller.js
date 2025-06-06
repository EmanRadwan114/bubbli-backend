import Order from "../../db/models/order.model.js";
import Cart from "./../../db/models/cart.model.js";
import Coupon from "../../db/models/coupon.model.js";

// * online payment using stripe
import Stripe from "stripe";
import User from "../../db/models/user.model.js";
import Product from "../../db/models/product.model.js";
import sendEmail, { orderDetailsHTMLContent } from "../utils/sendEmail.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//^ ------------------------------------------ create order ------------------------------------------
export const createOrder = async (req, res) => {
  let { shippingAddress, paymentMethod, couponCode, phone } = req.body;
  const SHIPPING_PRICE = 50; // default shipping price

  try {
    // 1. Get cart with populated products
    const cart = await Cart.findOne({ userID: req.user.id }).populate(
      "cartItems.productId"
    );
    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // 2. Validate coupon if provided
    let coupon = null;
    let couponDiscountPct = 0;
    if (couponCode) {
      coupon = await Coupon.findOne({ CouponCode: couponCode });
      if (!coupon) {
        return res.status(400).json({ message: "Coupon not found." });
      }
      if (coupon.CouponUsers.includes(req.user.id)) {
        return res
          .status(400)
          .json({ message: "You cannot use this coupon more than once." });
      }
      couponDiscountPct = coupon.CouponPercentage || 0;
    }

    // 3. Calculate total price before discount (sum of discounted product prices * quantity)
    let totalPriceBeforeDiscount = 0;
    for (const item of cart.cartItems) {
      const product = item.productId;
      const discountedPrice =
        product.price * (1 - (product.discount || 0) / 100);
      totalPriceBeforeDiscount += discountedPrice * item.quantity;
    }

    // 4. Calculate total price after coupon discount (apply coupon on totalPriceBeforeDiscount)
    const totalPriceAfterDiscount =
      totalPriceBeforeDiscount * (1 - couponDiscountPct / 100) + SHIPPING_PRICE;

    // 5. Build order items array including price details
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

    // 6. Create and save order
    const order = new Order({
      userID: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      phone,
      couponCode: couponCode || null,
      shippingPrice: SHIPPING_PRICE,
      totalPriceBeforeDiscount,
      totalPrice: totalPriceAfterDiscount,
      orderStatus: "waiting",
      shippingStatus: "pending",
    });

    await order.save();

    // 7. Add shipping address to user's address list (optional, avoid duplicates)
    const user = await User.findById(req.user.id);
    if (!user.address.includes(shippingAddress)) {
      user.address.push(shippingAddress);
      await user.save();
    }

    // 8. Handle payment methods
    if (paymentMethod === "cash") {
      // Mark coupon used if applied
      if (couponCode) {
        await Coupon.updateOne(
          { CouponCode: couponCode },
          { $push: { CouponUsers: req.user.id } }
        );
      }

      // Decrement stock & increment order count for each product
      for (const item of cart.cartItems) {
        const product = item.productId;
        if (product.stock > 0) {
          product.stock -= item.quantity;
          product.orderCount++;
          await product.save();
        }
      }

      // Send confirmation email
      await sendEmail(
        user.email,
        "Your Order Confirmation",
        orderDetailsHTMLContent,
        {
          cartItems: cart.cartItems,
          totalPrice: totalPriceAfterDiscount,
          createdAt: order.createdAt,
          _id: order._id,
        }
      );

      // Clear cart
      cart.cartItems = [];
      await cart.save();

      return res
        .status(201)
        .json({ message: "Order placed successfully.", data: order });
    }

    // 9. Handle online payment with Stripe checkout session
    if (paymentMethod === "online") {
      const lineItems = [
        {
          price_data: {
            currency: "egp",
            product_data: {
              name: "Order Total (after discount)",
            },
            unit_amount: Math.round(totalPriceAfterDiscount * 100), // amount in piasters
          },
          quantity: 1,
        },
      ];

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          customer_email: user.email,
          metadata: {
            orderId: order._id.toString(),
            couponCode: couponCode || "",
          },
          success_url: `${process.env.FRONT_URL}/order-confirmation/${order._id}`,
          cancel_url: `${process.env.FRONT_URL}/cart`,
        });
      } catch (stripeErr) {
        return res.status(502).json({
          message: "Payment gateway error",
          detail: stripeErr.message,
        });
      }

      return res.status(200).json({
        message: "Checkout session created successfully.",
        sessionId: session.id,
      });
    }
  } catch (err) {
    console.error("Order creation error:", err);
    return res
      .status(500)
      .json({ message: "Server error during order creation." });
  }
};

//^ --------------------------------------craete webhook---------------------------------------
export const createWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;

      // Validate required metadata
      if (!session.metadata || !session.metadata.orderId) {
        return res.status(400).json({ error: "Missing orderId in metadata" });
      }

      const couponCode = session.metadata.couponCode;
      const orderId = session.metadata.orderId;

      // 1. Update order status to 'paid'
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: "paid" },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found." });
      }

      // 2. Record coupon use if any
      if (couponCode) {
        await Coupon.updateOne(
          { CouponCode: couponCode },
          { $push: { CouponUsers: updatedOrder.userID } }
        );
      }

      // 3. Decrement stock and increment order count for each product in the order
      for (const orderItem of updatedOrder.orderItems) {
        const product = await Product.findById(orderItem.productId);
        if (product && product.stock > 0) {
          product.stock -= orderItem.quantity;
          product.orderCount++;
          await product.save();
        }
      }

      // 4. Find user and send order confirmation email
      const user = await User.findById(updatedOrder.userID);

      // 5. Empty user's cart after successful payment
      const cart = await Cart.findOne({ userID: updatedOrder.userID }).populate(
        "cartItems.productId"
      );

      if (cart) {
        await sendEmail(
          user.email,
          "Your Order Confirmation",
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

      return res.json({
        success: true,
        message: "Order marked as paid and cart emptied.",
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return res
        .status(500)
        .json({ error: "Server Error: Error processing webhook" });
    }
  }

  return res.json({ received: true });
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
const cancelOrder = async (req, res) => {}; //additional feature

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
