/**
 * handlers/agentRouter.js
 *
 * Receives the raw GitHub Copilot webhook POST, verifies the HMAC-SHA256
 * signature, parses the payload, and delegates to the chat handler.
 *
 * GitHub sends all Copilot Extension events as:
 *   POST /agent
 *   X-GitHub-Token: <token>
 *   Content-Type: application/json
 *   X-Hub-Signature-256: sha256=<hmac>
 */

import { Router } from "express";
import { verifySignature } from "../middleware/verifySignature.js";
import { handleChatRequest } from "./chatHandler.js";

export const agentRouter = Router();

// Verify every inbound request is genuinely from GitHub
agentRouter.use(verifySignature);

// Primary Copilot chat entry point
agentRouter.post("/", handleChatRequest);
