import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { messagesRouter } from "./routes/messages";
import { valentinesRouter } from "./routes/valentines";
import { reportsRouter } from "./routes/reports";
import { favoritesRouter } from "./routes/favorites";
import { adminRouter } from "./routes/admin";
import { setupSocket } from "./socket";
import { authMiddleware } from "./middleware/auth";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter(prisma));
app.use("/api/users", authMiddleware, usersRouter(prisma));
app.use("/api/messages", authMiddleware, messagesRouter(prisma, io));
app.use("/api/valentines", authMiddleware, valentinesRouter(prisma));
app.use("/api/reports", authMiddleware, reportsRouter(prisma));
app.use("/api/favorites", authMiddleware, favoritesRouter(prisma));
app.use("/api/admin", authMiddleware, adminRouter(prisma));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

setupSocket(io, prisma);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`AnonAZ backend running on http://localhost:${PORT}`);
});
