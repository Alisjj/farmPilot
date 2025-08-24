import { RequestHandler, Request, Response, NextFunction } from "express";

export function authorize(allowed: string[]): RequestHandler {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    // Allow TEST_BYPASS_AUTH to override role in dev/test
    if (process.env.TEST_BYPASS_AUTH === "true") {
      const testRole = req.header("x-test-role");
      if (testRole) req.user = req.user || {};
      req.user.role = testRole || req.user.role || "admin";
    }

    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.fail(403, { error: "forbidden" });
    }
    return next();
  };
}

export function authorizePermission(_permissionCode: string) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (process.env.TEST_BYPASS_AUTH === "true") return next();
    const role = req.user?.role;
    if (role === "admin") return next();
    // TODO: map permissions; for now only admin bypasses
    return res.fail(403, { error: "forbidden" });
  };
}
