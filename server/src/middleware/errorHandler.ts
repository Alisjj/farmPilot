import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod validation errors -> 400 with details
  if (err instanceof ZodError) {
    const formatted = err.format();
    return res
      .status(400)
      .json({ success: false, error: "validation", details: formatted });
  }

  // Known HTTP-style error shapes
  if (err && (err.status || err.statusCode)) {
    const status = err.status || err.statusCode || 500;
    return res
      .status(status)
      .json({ success: false, error: err.message || err });
  }

  // Minimal handling for common DB / constraint errors (Postgres)
  if (err && err.code && (err.code === "23505" || err.code === "23503")) {
    // 23505 = unique_violation, 23503 = foreign_key_violation
    return res
      .status(409)
      .json({
        success: false,
        error: "db_constraint",
        detail: err.detail || err.message,
      });
  }

  // Fallback
  console.error("Unhandled error:", err);
  return res
    .status(500)
    .json({ success: false, error: "internal_server_error" });
};

export default errorHandler;
