import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

export function favoritesRouter(prisma: PrismaClient) {
  const router = Router();

  router.get("/", async (req: AuthRequest, res) => {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.userId },
      include: { target: { select: { id: true, username: true, avatar: true, age: true, city: true, isOnline: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(favs.map((f) => f.target));
  });

  router.post("/:targetId", async (req: AuthRequest, res) => {
    const targetId = parseInt(req.params.targetId);
    if (targetId === req.userId) return res.status(400).json({ error: "Cannot add yourself" });
    const existing = await prisma.favorite.findUnique({
      where: { userId_targetId: { userId: req.userId!, targetId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: req.userId!, targetId } });
    res.json({ favorited: true });
  });

  return router;
}
