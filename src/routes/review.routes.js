import * as reviewController from "../controllers/review.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

import { Router } from "express";
const router = Router();

router.post("/add", reviewController.postReview);
router.get("/:productId", reviewController.getReviews);

export default router;
