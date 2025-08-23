import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Chưa đăng nhập" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.user = decoded; // Gán thông tin user vào request
    const loggedInUserId = req.userId;

    next();
  } catch (err) {
    return res.status(403).json({ error: "Token không hợp lệ" });
  }
};

export default authMiddleware;
