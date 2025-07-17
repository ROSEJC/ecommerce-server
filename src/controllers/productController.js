const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const where = {
    ...(category && { category: { name: category } }),
    ...(minPrice && { price: { gte: Number(minPrice) } }),
    ...(maxPrice && { price: { lte: Number(maxPrice) } }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const products = await prisma.product.findMany({
    where,
    skip: (page - 1) * limit,
    take: Number(limit),
    include: { category: true },
  });

  res.json(products);
};

exports.getProductById = async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
};
