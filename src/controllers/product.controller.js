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

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      categoryId,
      shopId,
      modelName,
      shape,
      controls,
      features,
      eartip,
      batteryBuds,
      batteryCase,
      chargePort,
      wingtips,
      releaseYear,
      waterResistance,
      supportedCodecs,
      minLatencyMs,
      manufacturer,
      quantity, // mặc định trong schema là 0, nhưng bạn có thể override
    } = req.body;

    // Validate cơ bản
    if (!name || !price || !image) {
      return res.status(400).json({ error: "Name, price, image are required" });
    }

    // Thêm product vào DB
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        categoryId: 1,
        modelName,
        shape,
        controls,
        eartip,
        batteryBuds: batteryBuds ? parseInt(batteryBuds) : null,
        batteryCase: batteryCase ? parseInt(batteryCase) : null,
        chargePort,
        wingtips: wingtips === undefined ? null : Boolean(wingtips),
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        waterResistance,
        minLatencyMs: minLatencyMs ? parseInt(minLatencyMs) : null,
        manufacturer,
        quantity: quantity ? parseInt(quantity) : undefined, // sẽ lấy default(0) nếu không có
        features: features || [],
        supportedCodecs: supportedCodecs || [],
      },
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
