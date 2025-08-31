import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = Router();

router.post("/add", authMiddleware, cartController.addToCart);
router.get("/:userId", authMiddleware, cartController.getCartbyUserId);
router.post(
  "/update/:userId",
  authMiddleware,
  cartController.updateCartByUserId
);

router.delete("/reset/:userId", authMiddleware, cartController.resetCart);
router.post("/checkout/:userId", authMiddleware, cartController.checkout);

export default router;
