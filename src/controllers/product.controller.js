import prisma from "../config/prisma.js";

// Lấy danh sách sản phẩm (có filter, phân trang)
export const getProducts = async (req, res) => {
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

  try {
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { category: true },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Lấy chi tiết sản phẩm theo id
export const getProductById = async (req, res) => {
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
};
