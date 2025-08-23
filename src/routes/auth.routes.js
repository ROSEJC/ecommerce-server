import * as authController from "../controllers/auth.controller.js";

import { Router } from "express";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
export default router;
