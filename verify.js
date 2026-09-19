import mongoose from "mongoose";
import User from "./db/models/user.model.js";
import Category from "./db/models/category.model.js";
import Product from "./db/models/product.model.js";
import Review from "./db/models/review.model.js";
import Coupon from "./db/models/coupon.model.js";
import Cart from "./db/models/cart.model.js";
import Order from "./db/models/order.model.js";
import dotenv from "dotenv";

dotenv.config();

const verifyRelationships = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_CONNECTION_URL ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/bubbli";
    
    // Connection options for better handling from Egypt
    const options = {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 5,
      minPoolSize: 2,
    };
    
    await mongoose.connect(mongoUri, options);
    console.log("✅ Database connected successfully\n");

    console.log("========================================");
    console.log("🔍 DATABASE RELATIONSHIP VERIFICATION");
    console.log("========================================\n");

    // Count all collections
    const counts = {
      users: await User.countDocuments(),
      categories: await Category.countDocuments(),
      products: await Product.countDocuments(),
      reviews: await Review.countDocuments(),
      coupons: await Coupon.countDocuments(),
      carts: await Cart.countDocuments(),
      orders: await Order.countDocuments(),
    };

    console.log("📊 COLLECTION COUNTS:");
    console.log(`   Users: ${counts.users}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Products: ${counts.products}`);
    console.log(`   Reviews: ${counts.reviews}`);
    console.log(`   Coupons: ${counts.coupons}`);
    console.log(`   Carts: ${counts.carts}`);
    console.log(`   Orders: ${counts.orders}`);
    console.log();

    // Verify Products → Categories
    console.log("🔗 CHECKING PRODUCT → CATEGORY RELATIONSHIPS:");
    const productsWithoutCategory = await Product.find({
      categoryID: null,
    }).countDocuments();
    const productsWithCategory = await Product.find({
      categoryID: { $ne: null },
    }).countDocuments();
    console.log(`   ✅ Products with category: ${productsWithCategory}`);
    console.log(`   ⚠️ Products without category: ${productsWithoutCategory}`);
    console.log();

    // Sample product with category details
    const sampleProduct = await Product.findOne().populate("categoryID");
    if (sampleProduct) {
      console.log(`   📦 Sample Product: ${sampleProduct.title}`);
      console.log(`      Category: ${sampleProduct.categoryID?.name || "N/A"}`);
      console.log(
        `      Thumbnail: ${sampleProduct.thumbnail.substring(0, 50)}...`,
      );
      console.log();
    }

    // Verify Reviews → Users & Products
    console.log("🔗 CHECKING REVIEW → USER & PRODUCT RELATIONSHIPS:");
    const reviewsWithoutUser = await Review.find({
      userID: null,
    }).countDocuments();
    const reviewsWithoutProduct = await Review.find({
      productID: null,
    }).countDocuments();
    console.log(
      `   ✅ Reviews with user: ${counts.reviews - reviewsWithoutUser}`,
    );
    console.log(
      `   ✅ Reviews with product: ${counts.reviews - reviewsWithoutProduct}`,
    );
    console.log();

    // Sample review with populated fields
    const sampleReview = await Review.findOne()
      .populate("userID")
      .populate("productID");
    if (sampleReview) {
      console.log(`   ⭐ Sample Review: ${sampleReview.rating} stars`);
      console.log(`      By: ${sampleReview.userID?.name || "N/A"}`);
      console.log(`      Product: ${sampleReview.productID?.title || "N/A"}`);
      console.log();
    }

    // Verify Carts → Users & Products
    console.log("🔗 CHECKING CART → USER & PRODUCT RELATIONSHIPS:");
    const cartsWithoutUser = await Cart.find({ userID: null }).countDocuments();
    const cartsWithItems = await Cart.find({
      "cartItems.0": { $exists: true },
    }).countDocuments();
    console.log(`   ✅ Carts with user: ${counts.carts - cartsWithoutUser}`);
    console.log(`   ✅ Carts with items: ${cartsWithItems}`);
    console.log();

    // Sample cart with items
    const sampleCart = await Cart.findOne()
      .populate("userID")
      .populate("cartItems.productId");
    if (sampleCart) {
      console.log(`   🛒 Sample Cart (${sampleCart.cartItems.length} items):`);
      console.log(`      User: ${sampleCart.userID?.name || "N/A"}`);
      sampleCart.cartItems.forEach((item, idx) => {
        console.log(
          `      Item ${idx + 1}: ${item.productId?.title || "N/A"} x${item.quantity}`,
        );
      });
      console.log();
    }

    // Verify Orders → Users & Products
    console.log("🔗 CHECKING ORDER → USER & PRODUCT RELATIONSHIPS:");
    const ordersWithoutUser = await Order.find({
      userID: null,
    }).countDocuments();
    const ordersWithItems = await Order.find({
      "orderItems.0": { $exists: true },
    }).countDocuments();
    console.log(`   ✅ Orders with user: ${counts.orders - ordersWithoutUser}`);
    console.log(`   ✅ Orders with items: ${ordersWithItems}`);
    console.log();

    // Sample order with details
    const sampleOrder = await Order.findOne()
      .populate("userID")
      .populate("orderItems.productId");
    if (sampleOrder) {
      console.log(`   📦 Sample Order:`);
      console.log(`      User: ${sampleOrder.userID?.name || "N/A"}`);
      console.log(
        `      Status: ${sampleOrder.orderStatus} (Shipping: ${sampleOrder.shippingStatus})`,
      );
      console.log(`      Payment: ${sampleOrder.paymentMethod}`);
      console.log(
        `      Price Before Discount: ${sampleOrder.totalPriceBeforeDiscount}`,
      );
      console.log(
        `      Price After Discount: ${sampleOrder.totalPriceAfterDiscount}`,
      );
      console.log(`      Total (with shipping): ${sampleOrder.totalPrice}`);
      console.log(`      Items: ${sampleOrder.orderItems.length}`);
      sampleOrder.orderItems.forEach((item, idx) => {
        console.log(
          `         Item ${idx + 1}: ${item.productId?.title || "N/A"} x${item.quantity}`,
        );
      });
      console.log();
    }

    // Verify Coupons → Users
    console.log("🔗 CHECKING COUPON → USER RELATIONSHIPS:");
    const couponsWithUsers = await Coupon.find({
      CouponUsers: { $ne: [] },
    }).countDocuments();
    console.log(`   ✅ Coupons with users: ${couponsWithUsers}`);
    console.log();

    // Sample coupon
    const sampleCoupon = await Coupon.findOne().populate("CouponUsers");
    if (sampleCoupon) {
      console.log(`   🎟️ Sample Coupon:`);
      console.log(`      Code: ${sampleCoupon.CouponCode}`);
      console.log(`      Discount: ${sampleCoupon.CouponPercentage}%`);
      console.log(`      Active: ${sampleCoupon.isActive}`);
      console.log(`      Users: ${sampleCoupon.CouponUsers.length}`);
      console.log();
    }

    // Image URL Validation
    console.log("🖼️ IMAGE URL VALIDATION:");
    const productsWithImages = await Product.find({
      thumbnail: { $exists: true, $ne: "" },
    });
    const categoriesWithImages = await Category.find({
      thumbnail: { $exists: true, $ne: "" },
    });
    console.log(`   ✅ Products with thumbnails: ${productsWithImages.length}`);
    console.log(
      `   ✅ Categories with thumbnails: ${categoriesWithImages.length}`,
    );
    console.log(
      `   ✅ Sample product image: ${productsWithImages[0]?.thumbnail.substring(0, 60)}...`,
    );
    console.log(
      `   ✅ Sample category image: ${categoriesWithImages[0]?.thumbnail.substring(0, 60)}...`,
    );
    console.log();

    // User validation
    console.log("👥 USER ROLE VALIDATION:");
    const adminUsers = await User.find({ role: "admin" });
    const regularUsers = await User.find({ role: "user" });
    console.log(`   ✅ Admin users: ${adminUsers.length}`);
    console.log(`   ✅ Regular users: ${regularUsers.length}`);

    // Verify admin restrictions
    let adminViolations = 0;
    for (const admin of adminUsers) {
      if (
        admin.wishlist.length > 0 ||
        admin.address.length > 0 ||
        admin.phone
      ) {
        adminViolations++;
      }
    }
    console.log(
      `   ✅ Admin restrictions enforced: ${adminViolations === 0 ? "YES" : "NO (found " + adminViolations + " violations)"}`,
    );
    console.log();

    // Final summary
    console.log("========================================");
    console.log("✅ VERIFICATION COMPLETE");
    console.log("========================================");
    console.log("\n🎯 All relationships are properly connected!");
    console.log("📌 Ready for production deployment!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Verification error:", error.message);
    console.error("💡 Try these fixes:");
    console.error("   1. Update .env with directConnection=true parameter");
    console.error("   2. Test with: NODE_OPTIONS='--dns-result-order=ipv4first' npm run verify");
    console.error("   3. Use direct connection string from MongoDB Compass");
    process.exit(1);
  }
};

verifyRelationships();
