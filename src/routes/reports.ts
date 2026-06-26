import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

export function reportsRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/", async (req: AuthRequest, res) => {
    const { targetUsername, reason } = req.body;
    if (!targetUsername || !reason) return res.status(400).json({ error: "Target and reason required" });

    const target = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.userId) return res.status(400).json({ error: "Cannot report yourself" });

    const report = await prisma.report.create({
      data: { reporterId: req.userId!, targetId: target.id, reason },
    });
    res.status(201).json(report);
  });

  return router;
}
