import User from "../../db/models/user.model.js";
import Order from "./../../db/models/order.model.js";
import Product from "./../../db/models/product.model.js";
import { isValidObjectId } from "mongoose";

// Helper to validate numeric range
const isNumericInRange = (val, min, max) => {
  const n = Number(val);
  return !isNaN(n) && n >= min && n <= max;
};

export const getAdminStats = async (req, res, next) => {
  try {
    const { type, metric, year, month } = req.query;

    if (!type || !metric) {
      return res.status(400).json({ message: "type and metric are required" });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);

    // Validate year/month if provided
    if (metric === "monthly" || metric === "revenue") {
      if (!yearNum || isNaN(yearNum)) {
        return res.status(400).json({ message: "Valid year is required" });
      }
    }

    if (metric === "daily") {
      if (
        !yearNum ||
        !monthNum ||
        isNaN(yearNum) ||
        !isNumericInRange(monthNum, 1, 12)
      ) {
        return res
          .status(400)
          .json({ message: "Valid year and month are required" });
      }
    }

    // ============================== ORDERS ===================================
    if (type === "orders") {
      if (metric === "total") {
        const totalOrders = await Order.countDocuments();
        return res.status(200).json({ totalOrders });
      }

      if (metric === "monthly") {
        const monthlyStats = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(`${yearNum}-01-01`),
                $lte: new Date(`${yearNum}-12-31`),
              },
            },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              month: "$_id",
              count: 1,
            },
          },
          { $sort: { month: 1 } },
        ]);
        return res.status(200).json({ monthlyStats });
      }

      if (metric === "daily") {
        const dailyStats = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(`${yearNum}-${monthNum}-01`),
                $lte: new Date(`${yearNum}-${monthNum}-31`),
              },
            },
          },
          {
            $group: {
              _id: { $dayOfMonth: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              day: "$_id",
              count: 1,
            },
          },
          { $sort: { day: 1 } },
        ]);
        return res.status(200).json({ dailyStats });
      }

      if (metric === "revenue") {
        const revenueStats = await Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(`${yearNum}-01-01`),
                $lte: new Date(`${yearNum}-12-31`),
              },
              orderStatus: "paid",
            },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              revenue: { $sum: "$totalPrice" },
            },
          },
          {
            $project: {
              month: "$_id",
              revenue: 1,
              _id: 0,
            },
          },
          { $sort: { month: 1 } },
        ]);

        return res.status(200).json({ revenueStats });
      }
    }

    // ============================== PRODUCTS ===================================
    if (type === "products") {
      if (metric === "top-ordered") {
        const topProducts = await Product.find()
          .sort({ orderCount: -1 })
          .limit(10)
          .select("title orderCount");
        return res.status(200).json({ topProducts });
      }

      if (metric === "least-ordered") {
        const leastProducts = await Product.find()
          .sort({ orderCount: 1 })
          .limit(10)
          .select("title orderCount");
        return res.status(200).json({ leastProducts });
      }
    }

    // ============================== INVALID CASES ===============================
    return res.status(400).json({
      message: "Invalid combination of type and metric",
    });
  } catch (error) {
    next(error);
  }
};
