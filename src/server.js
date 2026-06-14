/**
 * server.js – Legal Defense Agent
 * Entry point: spins up Express, wires middleware, mounts routes.
 */

import "dotenv/config";
import express from "express";
import { agentRouter } from "./handlers/agentRouter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
// Raw body MUST be preserved for GitHub signature verification.
// Do NOT use express.json() globally – it will consume the raw buffer.
app.use(requestLogger);
app.use(express.static('public'));
app.use(
  express.raw({ type: ["application/json", "application/*+json"], limit: "1mb" })
);

// ── Routes ──────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", agent: "legal-defense", version: "1.0.0" });
});

// All Copilot agent traffic arrives here
app.use("/agent", agentRouter);

// ── Error handling ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡️  Legal Defense Agent running on http://localhost:${PORT}`);
  console.log(`   POST  /agent  ← GitHub Copilot webhook endpoint`);
  console.log(`   GET   /health ← uptime check\n`);
});

export default app;
