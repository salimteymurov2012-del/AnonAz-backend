import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth";

export function authRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const { username, password, gender, age, city, district } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      if (username.length < 3 || password.length < 4) {
        return res.status(400).json({ error: "Min 3 chars for username, 4 for password" });
      }
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) return res.status(400).json({ error: "Username taken" });

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, password: hashed, gender, age: age ? parseInt(age) : null, city, district },
      });
      const token = generateToken(user.id);
      res.status(201).json({
        token,
        user: { id: user.id, username: user.username, gender: user.gender, age: user.age, city: user.city, district: user.district, createdAt: user.createdAt },
      });
    } catch (e) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "All fields required" });

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) return res.status(400).json({ error: "User not found" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Wrong password" });

      if (user.isBlocked) return res.status(403).json({ error: "Account blocked" });

      await prisma.user.update({ where: { id: user.id }, data: { isOnline: true, lastSeen: new Date() } });

      const token = generateToken(user.id);
      res.json({
        token,
        user: { id: user.id, username: user.username, avatar: user.avatar, gender: user.gender, age: user.age, city: user.city, district: user.district, description: user.description, createdAt: user.createdAt, isOnline: true },
      });
    } catch (e) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  return router;
}
