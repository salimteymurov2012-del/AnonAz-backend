import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "anonaz-secret-key-change-in-production";

export function setupSocket(io: Server, prisma: PrismaClient) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`User ${userId} connected`);
    socket.join(`user:${userId}`);

    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
    io.emit("user:online", { userId, online: true });

    socket.on("message:send", async ({ receiverId, content, replyToId, imageUrl }) => {
      const msg = await prisma.message.create({
        data: { senderId: userId, receiverId, content, replyToId, imageUrl },
        include: { sender: { select: { id: true, username: true, avatar: true } } },
      });
      io.to(`user:${receiverId}`).emit("message:new", msg);
      socket.emit("message:sent", msg);
    });

    socket.on("message:delete", async ({ messageId }) => {
      await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } });
      io.emit("message:deleted", { messageId });
    });

    socket.on("typing:start", ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit("typing:update", { userId, typing: true });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit("typing:update", { userId, typing: false });
    });

    socket.on("disconnect", async () => {
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen: new Date() } });
      io.emit("user:online", { userId, online: false });
    });
  });
}
