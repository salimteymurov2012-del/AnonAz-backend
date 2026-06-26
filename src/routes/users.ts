import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

export function usersRouter(prisma: PrismaClient) {
  const router = Router();

  router.get("/me", async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, avatar: true, gender: true, age: true, city: true, district: true, description: true, createdAt: true, lastSeen: true, isOnline: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  });

  router.put("/me", async (req: AuthRequest, res) => {
    const { avatar, gender, age, city, district, description } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar, gender, age: age ? parseInt(age) : undefined, city, district, description },
    });
    res.json(user);
  });

  router.get("/", async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { isBlocked: false },
      select: { id: true, username: true, avatar: true, gender: true, age: true, city: true, district: true, description: true, isOnline: true, lastSeen: true, createdAt: true },
      orderBy: { lastSeen: "desc" },
      take: 50,
    });
    res.json(users);
  });

  router.get("/online", async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { isOnline: true, isBlocked: false },
      select: { id: true, username: true, avatar: true, gender: true, age: true, city: true, district: true, isOnline: true, lastSeen: true },
      take: 20,
    });
    res.json(users);
  });

  router.get("/search", async (req, res) => {
    const { q, city, gender, minAge, maxAge } = req.query;
    const where: any = { isBlocked: false };
    if (q) where.username = { contains: q as string };
    if (city) where.city = city as string;
    if (gender) where.gender = gender as string;
    if (minAge || maxAge) {
      where.age = {};
      if (minAge) where.age.gte = parseInt(minAge as string);
      if (maxAge) where.age.lte = parseInt(maxAge as string);
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, avatar: true, gender: true, age: true, city: true, district: true, description: true, isOnline: true, lastSeen: true },
      take: 50,
    });
    res.json(users);
  });

  router.get("/:username", async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username, isBlocked: false },
      select: { id: true, username: true, avatar: true, gender: true, age: true, city: true, district: true, description: true, createdAt: true, lastSeen: true, isOnline: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  });

  return router;
}
