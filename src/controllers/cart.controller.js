import prisma from "../config/prisma.js";
import { getIO } from "../socket.js";

export const addToCart = async (req, res) => {
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
};

export const getCartbyUserId = async (req, res) => {
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
};

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
    getIO().to(userId.toString()).emit("data-updated", data);
  }
};

export const updateCartByUserId = async (req, res) => {
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
};

export const resetCart = async (req, res) => {
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
};

export const checkout = async (req, res) => {
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
};
