import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({ user: newUser, id: newUser.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    const favoriteProducts = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, favorites: favoriteProducts, role: user.role },
      "SECRET_KEY",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err || "Lỗi máy chủ" });
  }
};
