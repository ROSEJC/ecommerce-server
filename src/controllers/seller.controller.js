import e, { json } from "express";
import prisma from "../config/prisma.js";

const getCustomerCount = async () => {
  const data = await prisma.order.groupBy({
    by: [`userId`],
  });
  return data.length;
};

const getTodayRevenue = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    },
    include: {
      product: true,
    },
  });

  const revenue = orderItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
  return revenue;
};

const getRepeatRate = async () => {
  const ordersByUser = await prisma.order.groupBy({
    by: ["userId"],
    _count: { id: true },
  });

  // số khách hàng có >= 2 đơn
  const repeatCount = ordersByUser.filter((user) => user._count.id >= 2).length;

  // tổng số khách hàng
  const customerCount = await getCustomerCount();

  if (customerCount === 0) return 0; // tránh chia cho 0

  return (repeatCount / customerCount) * 100; // % khách hàng quay lại
};

const getTotalOrderToday = async () => {
  // Tạo khoảng thời gian từ 00:00 đến 23:59:59 của ngày đó
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Query Prisma
  const orderCount = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return orderCount;
};

const getTopProduct = async () => {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: "desc" },
    },
    take: 5,
  });

  const result = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true }, // chỉ lấy name thôi
      });
      return {
        name: product?.name ?? "Unknown",
        sold: item._sum.quantity,
      };
    })
  );

  return result;
};
const getOrderTotal = async (orderId) => {
  const data = await prisma.orderItem.findMany({
    where: { orderId },
  });

  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return total;
};
export const getOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { status: "Pending" },
    include: {
      items: {
        include: { product: true }, // phải include product
      },
      user: true,
    },
  });

  const formattedOrders = await Promise.all(
    orders.map(async (order) => {
      const formattedItems = order.items.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        price: item.price,
      }));

      const total = await getOrderTotal(order.id);

      return {
        id: order.id,
        customer: order.user.name,
        date: order.createdAt,
        total: total || 0,
        payment: order.paymentMethod,
        status: order.status,
        items: formattedItems,
      };
    })
  );

  res.json(formattedOrders);
};

export const getDashboard = async (req, res) => {
  console.log("test");
  const todayRevenue = await getTodayRevenue();
  const totalOrder = await getTotalOrderToday();
  const repeatRate = `${(await getRepeatRate()).toFixed(2)}%`;
  const stock = 258;
  const customers = await getCustomerCount();
  const stats = {
    revenueToday: todayRevenue,
    orders: totalOrder,
    stock,
    customers,
    repeatRate,
  };

  const topProductsData = await getTopProduct();

  res.json({ stats, topProductsData });
};
