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

const dbConnection = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTION_URL;
    await mongoose.connect(mongoUri);
    console.log("✅ Database connected successfully");
    console.log(`📌 Connected to: ${mongoUri}`);
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

// Image URLs - PINTEREST VERIFIED - Product/Object ONLY (No people/faces/bodies)
const categoryImages = [
  // Decor - Home decoration objects
  "https://i.pinimg.com/control1/736x/60/21/a6/6021a639812f59f0f245d3486fd02c73.jpg",
  // Accessories - Bags and accessories
  "https://i.pinimg.com/736x/b0/4d/dd/b04ddd3a2020a687e500589eb89e96bf.jpg",
  // Stationary - Office supplies and pens
  "https://i.pinimg.com/736x/4d/da/8b/4dda8b770f21dd422d91db62b45b28b3.jpg",
  // Toys - Games and toys
  "https://i.pinimg.com/736x/ab/5c/04/ab5c049ee5cec9c98734f9105b8548c8.jpg",
  // Notebook - Writing pads and notebooks
  "https://i.pinimg.com/control1/736x/1a/d6/63/1ad6634f0b4ede01b5f60c7a21ebd9fe.jpg",
  // Mugs - Coffee and tea mugs
  "https://i.pinimg.com/control1/1200x/2c/14/73/2c1473eec0adaee9f44c9c5c77126afb.jpg",
];

const productImages = [
  // Decor items
  "https://i.pinimg.com/736x/36/c6/bc/36c6bc4fd3836784c474d5bd1d4df729.jpg",
  "https://i.pinimg.com/736x/3a/87/9f/3a879fcadb6113c46887b09b81ecf078.jpg",
  // Accessories items
  "https://i.pinimg.com/control1/736x/a6/a4/11/a6a411cb8c772b4e70521167aeda0eeb.jpg",
  "https://i.pinimg.com/736x/3b/5e/11/3b5e1183de1a8afc712a2188593d94ca.jpg",
  // Stationary items
  "https://i.pinimg.com/control1/736x/1a/4a/4d/1a4a4d0be281b63295b729f0bf1c1fff.jpg",
  "https://i.pinimg.com/736x/fc/23/37/fc2337f113fdeff751ec40526b49de82.jpg",
  // Toys items
  "https://i.pinimg.com/control1/1200x/f3/d4/b0/f3d4b01fa85f017d4fd60dd13097694c.jpg",
  "https://i.pinimg.com/control1/736x/de/6c/82/de6c8234a1f80773ef2a4ea35bb4650c.jpg",
  // Notebook items
  "https://i.pinimg.com/736x/65/ff/3b/65ff3bc395fc47e569c147af42877fd5.jpg",
  "https://i.pinimg.com/736x/02/ac/25/02ac25734c2694826ad5ce728ab4bcf9.jpg",
  // Mugs items
  "https://i.pinimg.com/736x/a3/eb/97/a3eb97a8a91e459edf515494d87434d4.jpg",
  "https://i.pinimg.com/736x/6c/51/f3/6c51f301bd8583291c1443c8d31cd766.jpg",
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log("✅ Database cleared");

    // Seed Categories (6)
    console.log("📁 Seeding categories...");
    const categories = await Category.insertMany([
      { name: "Decor", thumbnail: categoryImages[0] },
      { name: "Accessories", thumbnail: categoryImages[1] },
      { name: "Stationary", thumbnail: categoryImages[2] },
      { name: "Toys", thumbnail: categoryImages[3] },
      { name: "Notebook", thumbnail: categoryImages[4] },
      { name: "Mugs", thumbnail: categoryImages[5] },
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Seed Users (35)
    console.log("👥 Seeding users...");
    const users = await User.insertMany(
      Array.from({ length: 35 }, (_, i) => {
        const isAdmin = i < 2;
        const userData = {
          name: `Customer ${i + 1}`,
          email: `user${i + 1}@bubbli.com`,
          password: "hashed_password_123", // In real scenario, use bcrypt
          role: isAdmin ? "admin" : "user",
          isEmailActive: i % 2 === 0,
          image: `https://i.pravatar.cc/150?img=${i}`,
        };

        // Only add phone, isPhoneVerified, and address for regular users (not admins)
        if (!isAdmin) {
          userData.phone = `201${String(i).padStart(9, "0")}`;
          userData.isPhoneVerified = i % 3 === 0;
          userData.address = [
            `${123 + i} Main Street, Cairo, Egypt`,
            `Apartment ${i}, New Cairo`,
          ];
        }

        return userData;
      }),
    );
    console.log(`✅ Created ${users.length} users`);

    // Seed Products (36 - 6 per category)
    console.log("⏱️ Seeding products...");
    const products = await Product.insertMany(
      Array.from({ length: 36 }, (_, i) => {
        const categoryIndex = Math.floor(i / 6);
        const categoryNames = [
          "Decor",
          "Accessories",
          "Stationary",
          "Toys",
          "Notebook",
          "Mugs",
        ];
        const categoryName = categoryNames[categoryIndex];

        // Product descriptions based on category
        const descriptions = {
          Decor: `Beautiful home decoration item. Perfect for adding style to any room. ${i + 1}`,
          Accessories: `Premium quality accessory. Modern design and durable material. ${i + 1}`,
          Stationary: `High-quality stationary product. Essential for office and school use. ${i + 1}`,
          Toys: `Fun and educational toy. Safe for all ages. ${i + 1}`,
          Notebook: `Premium notebook with quality pages. Perfect for note-taking. ${i + 1}`,
          Mugs: `Beautiful ceramic mug. Great for coffee, tea, or gifts. ${i + 1}`,
        };

        // Sample labels based on product index (using valid enum values)
        const validLabels = ["bestseller", "limited", "new", "hot", "deal"];
        const labels = [];
        if (i % 5 === 0) labels.push(validLabels[0]); // bestseller
        if (i % 7 === 0) labels.push(validLabels[1]); // limited
        if (i % 3 === 0) labels.push(validLabels[2]); // new
        if (i % 4 === 0) labels.push(validLabels[3]); // hot
        if (i % 6 === 0) labels.push(validLabels[4]); // deal

        return {
          categoryID: categories[categoryIndex]._id,
          title: `${categoryName} Product ${(i % 6) + 1} - Premium Item`,
          description: descriptions[categoryName],
          thumbnail: productImages[i % productImages.length],
          images: [
            productImages[(i + 1) % productImages.length],
            productImages[(i + 2) % productImages.length],
            productImages[(i + 3) % productImages.length],
          ],
          stock: Math.floor(Math.random() * 100) + 10,
          price: Math.floor(Math.random() * 1) + 300,
          discount: Math.floor(Math.random() * 50),
          material: ["Ceramic", "Plastic", "Metal", "Wood", "Glass"][i % 5],
          color: ["Black", "White", "Gold", "Silver", "Rose Gold"][i % 5],
          avgRating: Math.floor(Math.random() * 5) + 1,
          numberOfReviews: Math.floor(Math.random() * 50) + 5,
          label: labels.length > 0 ? labels : ["new"],
          orderCount: Math.floor(Math.random() * 200),
        };
      }),
    );
    console.log(`✅ Created ${products.length} products`);

    // Seed Reviews (30)
    console.log("⭐ Seeding reviews...");
    const reviews = await Review.insertMany(
      Array.from({ length: 30 }, (_, i) => ({
        userID: users[i % users.length]._id,
        productID: products[i % products.length]._id,
        description: `Great product! Very satisfied with my purchase. Quality is excellent and delivery was fast. ${i}`,
        rating: Math.floor(Math.random() * 5) + 1,
      })),
    );
    console.log(`✅ Created ${reviews.length} reviews`);

    // Seed Coupons (10)
    console.log("🎟️ Seeding coupons...");
    const coupons = await Coupon.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        CouponCode: `SAVE${String(i + 1).padStart(2, "0")}`,
        CouponUsers: users.slice(0, 5).map((u) => u._id),
        CouponPercentage: (i + 1) * 5, // 5%, 10%, 15%, etc.
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsageLimit: 100,
        isActive: i % 2 === 0,
      })),
    );
    console.log(`✅ Created ${coupons.length} coupons`);

    // Seed Carts (12)
    console.log("🛒 Seeding carts...");
    const carts = await Cart.insertMany(
      Array.from({ length: 12 }, (_, i) => ({
        userID: users[i]._id,
        cartItems: [
          {
            productId: products[i % products.length]._id,
            quantity: Math.floor(Math.random() * 3) + 1,
          },
          {
            productId: products[(i + 1) % products.length]._id,
            quantity: Math.floor(Math.random() * 3) + 1,
          },
          {
            productId: products[(i + 2) % products.length]._id,
            quantity: Math.floor(Math.random() * 3) + 1,
          },
        ],
      })),
    );
    console.log(`✅ Created ${carts.length} carts`);

    // Seed Orders (25)
    console.log("📦 Seeding orders...");
    const orders = await Order.insertMany(
      Array.from({ length: 25 }, (_, i) => {
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const orderItems = Array.from({ length: itemCount }, (_, j) => ({
          productId: products[(i + j) % products.length]._id,
          quantity: Math.floor(Math.random() * 3) + 1,
        }));

        const basePrice = orderItems.reduce((sum, item) => {
          const product = products.find((p) => p._id.equals(item.productId));
          return sum + (product.price * item.quantity || 0);
        }, 0);

        const discountAmount = Math.floor(basePrice * 0.1);
        const shippingPrice = 50;

        return {
          userID: users[i % users.length]._id,
          totalPriceBeforeDiscount: basePrice,
          totalPriceAfterDiscount: basePrice - discountAmount,
          totalPrice: basePrice - discountAmount + shippingPrice,
          couponCode:
            i % 3 === 0 ? coupons[i % coupons.length].CouponCode : null,
          shippingPrice: shippingPrice,
          phone: `010${String(i).padStart(8, "0")}`,
          orderItems: orderItems,
          shippingAddress: `${123 + i} Main Street, Cairo, Egypt`,
          paymentMethod: ["cash", "online"][Math.floor(Math.random() * 2)],
          orderStatus: ["paid", "waiting", "cancelled"][
            Math.floor(Math.random() * 3)
          ],
          shippingStatus: ["pending", "prepared", "shipped", "cancelled"][
            Math.floor(Math.random() * 4)
          ],
          transactionId: Math.random() > 0.5 ? `TXN_${i}_${Date.now()}` : null,
        };
      }),
    );
    console.log(`✅ Created ${orders.length} orders`);

    console.log("\n========================================");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Coupons: ${coupons.length}`);
    console.log(`   - Carts: ${carts.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

// Run seeding
dbConnection().then(() => seedDatabase());
