import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

export function adminRouter(prisma: PrismaClient) {
  const router = Router();

  router.get("/stats", async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const totalUsers = await prisma.user.count();
    const onlineUsers = await prisma.user.count({ where: { isOnline: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await prisma.user.count({ where: { createdAt: { gte: today } } });
    const totalReports = await prisma.report.count({ where: { resolved: false } });
    const totalValentines = await prisma.valentine.count();

    res.json({ totalUsers, onlineUsers, newToday, totalReports, totalValentines });
  });

  router.get("/users", async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const users = await prisma.user.findMany({
      select: { id: true, username: true, gender: true, age: true, city: true, isOnline: true, isBlocked: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(users);
  });

  router.put("/users/:id/block", async (req: AuthRequest, res) => {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const target = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isBlocked: true, isOnline: false },
    });
    res.json(target);
  });

  router.put("/users/:id/unblock", async (req: AuthRequest, res) => {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const target = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isBlocked: false },
    });
    res.json(target);
  });

  router.delete("/users/:id", async (req: AuthRequest, res) => {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ deleted: true });
  });

  router.get("/reports", async (req: AuthRequest, res) => {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const reports = await prisma.report.findMany({
      where: { resolved: false },
      include: {
        reporter: { select: { id: true, username: true } },
        target: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  });

  router.put("/reports/:id/resolve", async (req: AuthRequest, res) => {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    await prisma.report.update({ where: { id: parseInt(req.params.id) }, data: { resolved: true } });
    res.json({ resolved: true });
  });

  return router;
}
