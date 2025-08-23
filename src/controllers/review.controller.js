import prisma from "../config/prisma.js";

export const getReviews = async (req, res) => {
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
};

export const postReview = async (req, res) => {
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
};
