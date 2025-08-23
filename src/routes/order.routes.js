import * as orderController from "../controllers/order.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

import { Router } from "express";

const router = Router();

router.get("/:userId", authMiddleware, orderController.getOrdersByUserId);
router.patch(
  "/:orderId/status",
  authMiddleware,
  orderController.setOrderStatus
);

export default router;
