import prisma from "../config/prisma.js";

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      categoryId,
      quantity,
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
    } = req.body;

    const data = prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        categoryId: parseInt(categoryId),
        quantity: parseInt(quantity) || 0,

        //gia tri khong bat buoc
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
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      categoryId,
      quantity,
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
    } = req.body;

    const { productId } = parseInt(req.params);
    const data = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(image && { image }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(quantity && { quantity: parseInt(quantity) }),
      ...(modelName && { modelName }),
      ...(shape && { shape }),
      ...(controls && { controls }),
      ...(features && { features }),
      ...(eartip && { eartip }),
      ...(batteryBuds && { batteryBuds: parseInt(batteryBuds) }),
      ...(batteryCase && { batteryCase: parseInt(batteryCase) }),
      ...(chargePort && { chargePort }),
      ...(typeof wingtips !== "undefined" && { wingtips }),
      ...(releaseYear && { releaseYear: parseInt(releaseYear) }),
      ...(waterResistance && { waterResistance }),
      ...(supportedCodecs && { supportedCodecs }),
      ...(minLatencyMs && { minLatencyMs: parseInt(minLatencyMs) }),
      ...(manufacturer && { manufacturer }),
    };

    const updated = prisma.product.update({
      where: {
        id: productId,
      },
      data,
    });
    
  } catch (err) {
    res.status(500).json(err);
  }
};
