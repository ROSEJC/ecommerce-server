import * as favoriteController from "../controllers/favorite.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Router } from "express";

const router = Router();

router.get("/:userId", authMiddleware, favoriteController.getFavorite);
router.delete("/delete", authMiddleware, favoriteController.deleteFavorite);
router.post("/add", authMiddleware, favoriteController.addFavorite);

export default router;
