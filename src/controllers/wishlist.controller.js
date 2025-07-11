import User from "../../db/models/user.model.js";
import Product from "../../db/models/product.model.js";

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pid } = req.params;

    const product = await Product.findById(pid);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.wishlist.includes(pid)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(pid);
    await user.save();

    res.status(200).json({
      message: "Product added to wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getWishlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    const all = req.query.all || false;
    const user = await User.findById(req.user?.id).populate("wishlist");
    if (!user)
      return res.status(200).json({ message: "User not found", data: [] });
    let productsWishlist;
    let total = user.wishlist.length;
    if (all) {
      productsWishlist = user?.wishlist;
    } else {
      productsWishlist = user?.wishlist.slice(skip, skip + limit);
    }

    let finalProducts = [];

    for (const item of productsWishlist) {
      const product = await Product.findById(item._id).populate("categoryID");
      const category = product.categoryID;
      delete product.categoryID;
      const newProd = {
        _id: item._id,
        title: item.title,
        price: item.price,
        avgRating: item.avgRating,
        numberOfReviews: item.numberOfReviews,
        thumbnail: item.thumbnail,
        label: item.label,
        description: item.description,
        category: category.name,
      };

      finalProducts.push(newProd);
    }

    res.status(200).json({
      data: finalProducts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

// wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
const deleteFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { pid } = req.params;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = user.wishlist.filter((item) => item.toString() !== pid);

    await user.save();

    return res
      .status(200)
      .json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("❌ wishlist Deletion Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = [];

    await user.save();

    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.error("❌ wishlist Deletion Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export default {
  addToWishlist,
  getWishlist,
  deleteFromWishlist,
  clearWishlist,
};
