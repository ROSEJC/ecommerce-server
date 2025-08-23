import prisma from "../config/prisma.js";

export const getOrdersByUserId = async (req, res) => {
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
};

export const setOrderStatus = async (req, res) => {
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
};
