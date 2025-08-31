import * as sellerController from "../controllers/seller.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Router } from "express";

const router = Router();

router.get("/dashboard", sellerController.getDashboard);
router.get("/orders", sellerController.getOrders);

export default router;
