/**
 * middleware/requestLogger.js
 * Minimal structured request logger.
 */
export function requestLogger(req, _res, next) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
}
