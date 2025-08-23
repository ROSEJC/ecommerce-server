// src/app.js
import prisma from "./config/prisma.js";

import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import authRoutes from "./routes/auth.routes.js";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import yargs from "yargs";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

import { initSocket } from "./socket.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);
initSocket(server);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/favorite", favoriteRoutes);
app.use("/reviews", reviewRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
