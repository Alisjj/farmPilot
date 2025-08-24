import { RequestHandler } from "express";
import jwt, { Secret } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { sub: string; role: string; id?: number };
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // Test bypass: allow tests to set TEST_BYPASS_AUTH=true and provide role via header
  if (process.env.TEST_BYPASS_AUTH === "true") {
    const testRole = req.header("x-test-role");
    const testId = req.header("x-test-id");
    if (testRole) {
      req.user = {
        sub: "test",
        role: testRole,
        id: testId ? Number(testId) : undefined,
      };
      return next();
    }
    // If no test role header provided, fall through to normal auth check
  }

  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.fail(401, { error: "missing or invalid token" });
  }
  const token = auth.replace(/^Bearer /i, "");
  try {
    const secret: Secret = (process.env.JWT_SECRET || "dev") as Secret;
    const payload = jwt.verify(token, secret) as any;
    req.user = { sub: payload.sub, role: payload.role, id: payload.id };
    return next();
  } catch (err) {
    return res.fail(401, { error: "invalid token" });
  }
};

export default isAuthenticated;
