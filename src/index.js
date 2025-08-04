// src/app.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcrypt");
const { middleware } = require("yargs");

const app = express();

app.use(cors());
app.use(express.json());

const jwt = require("jsonwebtoken");
const e = require("express");
const http = require("http");

const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // không dùng "*"
    methods: ["GET", "POST"],
    credentials: true, // <-- BẮT BUỘC
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Client gửi userId để join vào room riêng
  socket.on("join-user", (userId) => {
    socket.join(userId.toString()); // tạo "phòng" riêng theo userId
    console.log(`User ${userId} joined room`);
  });
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Chưa đăng nhập" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.user = decoded; // Gán thông tin user vào request
    const loggedInUserId = req.userId;

    next();
  } catch (err) {
    return res.status(403).json({ error: "Token không hợp lệ" });
  }
};

app.get("/", (req, res) => {
  res.send("API is running");
});
app.get("/product", async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    name,
    page = 1,
    limit = 10,
    shape,
    brand,
  } = req.query;

  const where = {
    ...(category && { category: { name: category } }),
    ...(minPrice && { price: { gte: Number(minPrice) } }),
    ...(maxPrice && { price: { lte: Number(maxPrice) } }),
    ...(name && { name: { contains: name, mode: "insensitive" } }),
    ...(shape && { shape }),
    ...(brand && { manufacturer: brand }),
  };

  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    include: { category: true },
  });

  res.json(products);
});

app.get("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/cart/add
app.post("/cart/add", authMiddleware, async (req, res) => {
  const userId = parseInt(req.body.userId);
  const productId = parseInt(req.body.productId);
  const quantity = parseInt(req.body.quantity);

  // Kiểm tra đầu vào
  if (!userId || !productId || quantity <= 0) {
    return res.status(400).json({ message: "Yêu cầu nhập đủ thông tin" });
  }

  try {
    // Tìm giỏ hàng của người dùng
    let userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    // Nếu chưa có thì tạo giỏ hàng
    if (!userCart) {
      userCart = await prisma.cart.create({
        data: {
          user: { connect: { id: userId } },
        },
        include: { items: true },
      });
    }

    // Kiểm tra item đã tồn tại trong giỏ chưa
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        productId,
      },
    });

    // Nếu có rồi thì cộng thêm số lượng
    if (existingItem) {
      console.log("user id", productId);

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
      return res.json({
        message: "Sản phẩm đã tồn tại nên đã cộng thêm số lượng.",
        item: updatedItem,
      });
    }

    // Nếu chưa có thì tạo mới
    const newItem = await prisma.cartItem.create({
      data: {
        cartId: userCart.id,
        productId,
        quantity,
      },
    });

    return res.json({
      message: "Đã thêm sản phẩm vào giỏ hàng.",
      item: newItem,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", err });
  }
});

app.get("/cart/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }

    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const reSendDatas = async (userId) => {
  userId = parseInt(userId);
  const data = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (data) {
    io.to(userId.toString()).emit("data-updated", data);
  }
};
//update cart items quantity
app.post("/cart/update/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { productId, newQuantity } = req.body;

  const userIdNum = parseInt(userId);
  const productIdNum = parseInt(productId);
  const quantityNum = parseInt(newQuantity);

  try {
    const userCart = await prisma.cart.findUnique({
      where: { userId: userIdNum },
    });

    if (!userCart) {
      return res.status(400).json({ message: "Giỏ hàng không tồn tại" });
    }

    const item = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        productId: productIdNum,
      },
    });

    if (!item) {
      return res
        .status(400)
        .json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: quantityNum },
    });
    reSendDatas(userId);
    return res
      .status(200)
      .json({ message: "Cập nhật thành công", updatedItem });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});
//reset cart
app.delete("/cart/reset/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "userId không hợp lệ" });
  }

  try {
    // Tìm cart theo userId
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    }

    // Xóa tất cả các item trong cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return res.status(200).json({ message: "Đã reset giỏ hàng thành công" });
  } catch (error) {
    console.error("Lỗi khi reset giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});
// POST /checkout/:userId
app.post("/checkout/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res
      .status(400)
      .json({ message: "Missing shipping info or payment method" });
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not found" });
    }

    // Tạo Order
    const order = await prisma.order.create({
      data: {
        userId,
        shippingAddress,
        paymentMethod,
        status: "Delivered",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // Xoá giỏ hàng sau khi checkout
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res
      .status(201)
      .json({ message: "Order placed successfully", orderId: order.id });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: error.message });
  }
});

//Get User Cart
app.get("/orders/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // lịch sử mới nhất trước
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/orders/:orderId/status", authMiddleware, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const { status } = req.body;

  const validStatus = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Received",
  ];

  if (!validStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    res.json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/favorite/add", authMiddleware, async (req, res) => {
  let { productId, userId } = req.body;

  productId = parseInt(productId);
  userId = parseInt(userId);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not exists" });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not exists" });
    }

    const alreadyFavorited = await prisma.favorite.findFirst({
      where: { productId, userId },
    });

    if (alreadyFavorited) {
      return res.status(400).json({ message: "Already favorited" });
    }

    const newFavorite = await prisma.favorite.create({
      data: {
        productId,
        userId,
      },
    });

    return res.status(201).json(newFavorite);
  } catch (err) {
    console.error("Error adding favorite:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.delete("/favorite/delete", authMiddleware, async (req, res) => {
  let { productId, userId } = req.body;

  productId = parseInt(productId);
  userId = parseInt(userId);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not exists" });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not exists" });
    }

    await prisma.favorite.deleteMany({
      where: { userId, productId },
    });

    io.to(userId.toString()).emit("data-favorite-updated");

    return res.status(200).json({ message: "Favorite removed successfully" });
  } catch (err) {
    console.error("Error removing favorite:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/favorite/:userId", authMiddleware, async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not exists" });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true, // include full product details
      },
    });

    return res.status(200).json(favorites);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({ user: newUser, id: newUser.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }
    const favoriteProducts = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, favorites: favoriteProducts },
      "SECRET_KEY",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err || "Lỗi máy chủ" });
  }
});

// GET all reviews for a specific product
app.get("/reviews/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId);

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST a new review
app.post("/api/reviews", async (req, res) => {
  let { productId, rating, comment, orderItemId, userId } = req.body;

  productId = parseInt(productId);
  rating = parseInt(rating);
  orderItemId = orderItemId ? parseInt(orderItemId) : undefined;
  userId = parseInt(userId);

  if (
    isNaN(productId) ||
    isNaN(rating) ||
    isNaN(userId) ||
    rating < 1 ||
    rating > 5
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const newReview = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
        orderItem: orderItemId ? { connect: { id: orderItemId } } : undefined,
      },
    });

    if (orderItemId) {
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { reviewId: newReview.id },
      });
    }

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Failed to create review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
