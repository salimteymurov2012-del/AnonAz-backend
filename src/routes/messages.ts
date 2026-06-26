import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import { AuthRequest } from "../middleware/auth";

export function messagesRouter(prisma: PrismaClient, io: Server) {
  const router = Router();

  router.get("/:userId", async (req: AuthRequest, res) => {
    const otherId = parseInt(req.params.userId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: otherId },
          { senderId: otherId, receiverId: req.userId },
        ],
        isDeleted: false,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json(messages);
  });

  router.get("/conversations/list", async (req: AuthRequest, res) => {
    const sent = await prisma.message.findMany({
      where: { senderId: req.userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, username: true, avatar: true, isOnline: true } } },
      distinct: ["receiverId"],
    });
    const received = await prisma.message.findMany({
      where: { receiverId: req.userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, username: true, avatar: true, isOnline: true } } },
      distinct: ["senderId"],
    });
    const conversations = [...sent, ...received];
    res.json(conversations);
  });

  return router;
}
