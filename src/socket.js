import { Server } from "socket.io";

let io; // biến toàn cục

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-user", (userId) => {
      socket.join(userId.toString());
      console.log(`User ${userId} joined room`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.io chưa được khởi tạo! Gọi initSocket(server) trước."
    );
  }
  return io;
}
