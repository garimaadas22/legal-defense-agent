/**
 * middleware/errorHandler.js
 * Catches any unhandled errors thrown in route handlers.
 */
export function errorHandler(err, _req, res, _next) {
  console.error("[ErrorHandler]", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
}
