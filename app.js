import "dotenv/config";

// ^-------------------import
import db from "./db/dbConnection.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalErrHandler from "./src/middlewares/globalErrHandler.middleware.js";
import authRouter from "./src/routes/auth.routes.js";
import categoryRouter from "./src/routes/category.routes.js";
import couponRouter from "./src/routes/coupon.routes.js";
import productRouter from "./src/routes/product.routes.js";
import cartRouter from "./src/routes/cart.routes.js";
import orderRouter from "./src/routes/order.routes.js";
import reviewRouter from "./src/routes/review.routes.js";
import userRouter from "./src/routes/user.routes.js";
import wishlistRouter from "./src/routes/wishlist.routes.js";
import orderController from "./src/controllers/order.controller.js";
import chatbotRouter from "./src/routes/chatbot.routes.js";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import { getAdminStats } from "./src/controllers/admin.controller.js";
import authenticate from "./src/middlewares/authentication.middleware.js";
import systemRoles from "./src/utils/systemRoles.js";

// ^------------------create server
const app = express();
// ?parse incoming JSON payloads (application/json)
app.use(express.json());

const PORT = process.env.PORT || 7500;

// ^------------------global middlewares
app.use(cookieParser());

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [process.env.FRONT_URL, process.env.LOCAL_FRONT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ?handle form submissions (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ^--------------------------------create webhook & verify payment--------------------------
app.post("/paymob/webhook", orderController.createWebhook);
app.get("/paymob/webhook", orderController.redirectAfterPayment);

// ^------------------main routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/categories", categoryRouter);
app.use("/coupons", couponRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/reviews", reviewRouter);
app.use("/wishlist", wishlistRouter);

// ^------------------- AI ChatBot

app.use("/", chatbotRouter);

// ^------------------admin dashboard stats
app.get(
  "/admins/dashboard-stats",
  authenticate([systemRoles.admin]),
  getAdminStats
);

// ^------------------error handling
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

app.use(globalErrHandler);

mongoose
  .connect(process.env.MONGODB_CONNECTION_URL, {
    dbName: "bubbli",
  })
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server listening at http://127.0.0.1:${PORT}`);

      // ✅ Safe and clean route listing
      const endpoints = listEndpoints(app);
      console.log("Registered routes:");
      endpoints.forEach((ep) => {
        console.log(`${ep.methods.join(", ")} ${ep.path}`);
      });
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
