import { Router } from "express";
import {
  getProducts,
  getProductById,
  addProduct,
} from "../controllers/product.controller.js";

const router = Router();

// GET /product
router.get("/", getProducts);

// GET /product/:id
router.get("/:id", getProductById);

router.post("/add", addProduct);
export default router;
