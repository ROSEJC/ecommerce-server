import { Router } from "express";
import {
  getProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = Router();

// GET /product
router.get("/", getProducts);

// GET /product/:id
router.get("/:id", getProductById);

export default router;
