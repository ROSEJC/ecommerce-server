import prisma from "../config/prisma.js";

export const addFavorite = async (req, res) => {
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
};

export const deleteFavorite = async (req, res) => {
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
};

export const getFavorite = async (req, res) => {
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
};
