import { Router } from "express";
import wishlistControllers from "../controllers/wishlist.controller.js";
import authenticate from "../middlewares/authentication.middleware.js";
import systemRoles from "../utils/systemRoles.js";

// import wishlistValidation from "../validation/wishlist.validation.js";

const wishlistRouter = new Router();

//* get all wishlist of current user
wishlistRouter
  .route("/")
  .get(wishlistControllers.getWishlist)
  .delete(authenticate([systemRoles.user]), wishlistControllers.clearWishlist);
wishlistRouter
  .route("/:pid")
  .put(authenticate([systemRoles.user]), wishlistControllers.addToWishlist)
  .delete(
    authenticate([systemRoles.user]),
    wishlistControllers.deleteFromWishlist
  );

export default wishlistRouter;
