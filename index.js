const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const messages = [];
const nicks = new Map();
let id = 0;

app.get("/api/messages", (_, res) => res.json(messages.slice(-100)));
app.get("/api/online", (_, res) => res.json([...new Set(nicks.values())]));

io.on("connection", (socket) => {
  socket.on("join", (nick) => {
    nicks.set(socket.id, (nick || "Anonymous").slice(0, 20));
    io.emit("users", [...new Set(nicks.values())]);
    io.emit("system", `${nicks.get(socket.id)} вошёл в чат`);
  });

  socket.on("msg", (text) => {
    const m = { id: ++id, nick: nicks.get(socket.id) || "Anonymous", text: String(text).slice(0, 500), time: new Date().toLocaleTimeString() };
    messages.push(m);
    io.emit("msg", m);
  });

  socket.on("typing", () => {
    const n = nicks.get(socket.id);
    if (n) socket.broadcast.emit("typing", n);
  });

  socket.on("disconnect", () => {
    const n = nicks.get(socket.id);
    nicks.delete(socket.id);
    io.emit("users", [...new Set(nicks.values())]);
    if (n) io.emit("system", `${n} покинул чат`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Chat on :${PORT}`));
