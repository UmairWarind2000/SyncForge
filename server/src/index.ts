// server/src/index.ts

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setupPresenceHandler } from "./handlers/presenceHandler";
import { setupBoardHandler } from "./handlers/boardHandler";
import { setupChatHandler } from "./handlers/chatHandler";
import { setupEditorHandler } from "./handlers/editorHandler";

const app    = express();
const httpServer = createServer(app);
const PORT   = process.env.PORT || 4000;
const CLIENT = process.env.CLIENT_URL || "http://localhost:3000";

// ─── HTTP middleware ──────────────────────────────────────────────────────────

app.use(cors({ origin: CLIENT, credentials: true }));
app.use(express.json());

// Health check endpoint — used to keep Railway instance alive
// Ping this every 14 minutes from cron-job.org
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Socket.io setup ─────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Increase ping timeout for slow connections
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Socket.io middleware — attach user info from handshake ──────────────────

io.use((socket, next) => {
  const { userId, userName, userImage } = socket.handshake.auth;

  if (!userId) {
    return next(new Error("Authentication required"));
  }

  // Attach user info to socket for use in handlers
  (socket as any).userId    = userId;
  (socket as any).userName  = userName  || "Unknown";
  (socket as any).userImage = userImage || null;

  next();
});

// ─── Connection handler ───────────────────────────────────────────────────────

io.on("connection", (socket) => {
    setupEditorHandler(io, socket);
  console.log(
    `[WS] Connected: ${socket.id} | user: ${(socket as any).userName}`
  );

  // Register all event handlers for this socket
  setupPresenceHandler(io, socket);
  setupBoardHandler(io, socket);
  setupChatHandler(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`[WS] Disconnected: ${socket.id} | reason: ${reason}`);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[Server] Socket.io running on port ${PORT}`);
  console.log(`[Server] Accepting connections from ${CLIENT}`);
});