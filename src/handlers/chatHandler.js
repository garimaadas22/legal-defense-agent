/**
 * handlers/chatHandler.js
 *
 * Core handler for Copilot chat messages.
 *
 * Flow:
 *  1. Parse the Copilot payload (messages array, user info, references).
 *  2. Extract any code blocks from the last user message.
 *  3. Run the local license scanner against extracted code.
 *  4. Build a system prompt that tells the LLM what to do with the findings.
 *  5. Forward the enriched messages to the Copilot LLM via SSE streaming,
 *     using @copilot-extensions/preview-sdk helper utilities.
 *  6. Stream the LLM tokens back to the GitHub Chat UI in real time.
 */

import {
  createTextEvent,
  createDoneEvent,
  createErrorsEvent,
  createConfirmationEvent,
} from "@copilot-extensions/preview-sdk";

import { scanCodeForLicenseIssues } from "../core/licenseScanner.js";
import { buildSystemPrompt } from "../core/promptBuilder.js";
import { extractCodeBlocks } from "../utils/codeExtractor.js";
import { forwardToCopilotLLM } from "../core/copilotLLM.js";

/**
 * handleChatRequest
 * Express request handler – writes an SSE stream to `res`.
 */
export async function handleChatRequest(req, res) {
  // ── 1. Parse payload ──────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf-8"));
  } catch {
    res.setHeader("Content-Type", "text/event-stream");
    res.write(
      createErrorsEvent([
        { type: "agent", code: "parse_error", message: "Invalid JSON payload", identifier: "legal-defense" },
      ])
    );
    res.end();
    return;
  }

  const messages = payload.messages ?? [];
  const githubToken = req.headers["x-github-token"];

  // ── 2. Extract code from the last user message ────────────────────────────
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMsg?.content ?? "";
  const codeBlocks = extractCodeBlocks(userText);

  // ── 3. Run license scanner ────────────────────────────────────────────────
  const scanResults = scanCodeForLicenseIssues(codeBlocks);

  // ── 4. Build enriched system prompt ──────────────────────────────────────
  const systemPrompt = buildSystemPrompt(scanResults);

  // ── 5 & 6. Forward to Copilot LLM and stream back ────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // If there are violations, send a structured "confirmation" card first
    // so the user sees a rich warning banner in GitHub Chat before prose.
    if (scanResults.hasViolations) {
      const violationNames = scanResults.violations
        .map((v) => `${v.license} (${v.snippet})`)
        .join(", ");

      res.write(
        createConfirmationEvent({
          id: "license-warning",
          title: "⚠️ Potential License Violation Detected",
          message: `Found possible ${violationNames} match. The agent will now refactor the flagged section to ensure IP safety while preserving full functionality.`,
        })
      );
    }

    await forwardToCopilotLLM({
      messages,
      systemPrompt,
      githubToken,
      onToken: (token) => {
        res.write(createTextEvent(token));
      },
    });
  } catch (err) {
    console.error("[ChatHandler] LLM forwarding error:", err.message);
    res.write(
      createErrorsEvent([
        {
          type: "agent",
          code: "llm_error",
          message: "Failed to get a response from the Copilot LLM. Please try again.",
          identifier: "legal-defense",
        },
      ])
    );
  }

  res.write(createDoneEvent());
  res.end();
}
