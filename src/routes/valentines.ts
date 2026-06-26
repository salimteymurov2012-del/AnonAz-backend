import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

export function valentinesRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/send", async (req: AuthRequest, res) => {
    const { toUsername, text } = req.body;
    if (!toUsername || !text) return res.status(400).json({ error: "Username and text required" });

    const target = await prisma.user.findUnique({ where: { username: toUsername } });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.userId) return res.status(400).json({ error: "Cannot send to yourself" });
    if (text.length > 500) return res.status(400).json({ error: "Text too long (max 500)" });

    const valentine = await prisma.valentine.create({
      data: { fromId: req.userId!, toId: target.id, text },
    });
    res.status(201).json(valentine);
  });

  router.get("/received", async (req: AuthRequest, res) => {
    const valentines = await prisma.valentine.findMany({
      where: { toId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { id: true, username: true } } },
    });
    res.json(valentines);
  });

  router.get("/sent", async (req: AuthRequest, res) => {
    const valentines = await prisma.valentine.findMany({
      where: { fromId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { to: { select: { id: true, username: true } } },
    });
    res.json(valentines);
  });

  router.put("/:id/accept", async (req: AuthRequest, res) => {
    const v = await prisma.valentine.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!v || v.toId !== req.userId) return res.status(403).json({ error: "Not allowed" });
    const updated = await prisma.valentine.update({ where: { id: v.id }, data: { status: "accepted" } });
    res.json(updated);
  });

  router.put("/:id/reject", async (req: AuthRequest, res) => {
    const v = await prisma.valentine.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!v || v.toId !== req.userId) return res.status(403).json({ error: "Not allowed" });
    const updated = await prisma.valentine.update({ where: { id: v.id }, data: { status: "rejected" } });
    res.json(updated);
  });

  return router;
}
