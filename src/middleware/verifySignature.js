/**
 * middleware/verifySignature.js
 *
 * Validates the X-Hub-Signature-256 header that GitHub attaches to every
 * Copilot Extension webhook delivery.
 *
 * GitHub signs the raw request body with your Webhook Secret using HMAC-SHA256.
 * We must compare using timingSafeEqual to prevent timing attacks.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(req, res, next) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // In local dev without a secret configured, skip verification
  if (!secret || secret === "your_webhook_secret_here") {
    console.warn("[VerifySignature] WARNING: No webhook secret set – skipping verification (dev mode only)");
    return next();
  }

  const sigHeader = req.headers["x-hub-signature-256"];

  if (!sigHeader) {
    return res.status(401).json({
      error: "Missing X-Hub-Signature-256 header",
    });
  }

  // req.body is a Buffer because we used express.raw()
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: "Request body must be raw buffer" });
  }

  // Compute expected signature
  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody);
  const expectedSig = `sha256=${hmac.digest("hex")}`;

  // Constant-time comparison
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  const receivedBuf = Buffer.from(sigHeader, "utf8");

  if (
    expectedBuf.length !== receivedBuf.length ||
    !timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    console.warn("[VerifySignature] Signature mismatch – rejecting request");
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}
