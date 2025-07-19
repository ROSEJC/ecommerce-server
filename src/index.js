// src/app.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});
app.get('/product', async (req, res) => {
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
});


app.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { category: true }, 
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// POST /api/cart/add
app.post('/cart/add', async (req, res) => {
  const { userId, productId, quantity, items } = req.body;

  if (!userId || (!items && (!productId || !quantity))) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!userCart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại.' });
    }

    const results = [];

    // ✅ Nếu là nhiều sản phẩm
    if (Array.isArray(items)) {
      for (const { productId, quantity } of items) {
        const existingItem = await prisma.cartItem.findFirst({
          where: { cartId: userCart.id, productId },
        });

        if (existingItem) {
          const updatedItem = await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
          });
          results.push(updatedItem);
        } else {
          const newItem = await prisma.cartItem.create({
            data: { cartId: userCart.id, productId, quantity },
          });
          results.push(newItem);
        }
      }

      return res.json({ message: 'Thêm nhiều sản phẩm thành công.', items: results });
    }

    // ✅ Nếu là 1 sản phẩm duy nhất
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId },
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
      return res.json({ message: 'Đã cập nhật sản phẩm.', item: updatedItem });
    } else {
      const newItem = await prisma.cartItem.create({
        data: { cartId: userCart.id, productId, quantity },
      });
      return res.json({ message: 'Đã thêm sản phẩm mới.', item: newItem });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});


app.get('/cart/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


app.get('/cart/total/:userId' , async (req,res) => {
  const userId = parseInt(req.params.userId);
  try {
    const cart = await prisma.cart.findUnique({
      where: {userId},
      include: {
        items:{
          include: {
            product: true,
          }
        }
      }
    });
    if(!cart) 
      return res.status(404).json({message: 'Khong tim thay gio hang'});

    const total = cart.items.reduce((sum,item) =>{
      return sum + item.quantity * item.product.price
    },0)
    res.json({total});
  }catch(err) {
    console.error(err)
    res.status(500).json({message: err.message})
  }
});






// POST /checkout/:userId
app.post('/checkout/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: "Missing shipping info or payment method" });
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
        status: "Pending", // hoặc "Processing"
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

    res.status(201).json({ message: "Order placed successfully", orderId: order.id });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: error.message });
  }
});

//Get User Cart
app.get('/orders/:userId', async (req, res) => {
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
      orderBy: { createdAt: 'desc' }, // lịch sử mới nhất trước
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.patch('/orders/:orderId/status', async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const { status } = req.body;

  const validStatus = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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


app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    res.status(201).json({ user: newUser, id: newUser.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
});


app.post('/sign_in', async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message || "Lỗi máy chủ" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
