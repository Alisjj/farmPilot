import type { RequestHandler } from "express";
import { storage } from "../storage";

// Simple role-based authorization middleware for two-role system: admin | staff
// Usage: app.get('/route', isAuthenticated, authorize(['admin']), handler)
export function authorize(allowed: string[]): RequestHandler {
    return (req: any, res, next) => {
        // In test mode allow overriding role via header to simplify integration tests
        if (process.env.TEST_BYPASS_AUTH === "true") {
            const testRole = req.header("x-test-role");
            if (testRole) {
                req.user.role = testRole;
            }
            return next();
        }

        const role = req.user?.role;
        if (!role || !allowed.includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}

// Permission-based authorization (admins bypass by default)
export function authorizePermission(permissionCode: string): RequestHandler {
    return async (req: any, res, next) => {
        try {
            if (process.env.TEST_BYPASS_AUTH === "true") return next();
            const role = req.user?.role;
            if (role === "admin") return next();
            const has = await storage.userHasPermission(
                req.user.id,
                permissionCode
            );
            if (!has)
                return res.status(403).json({ message: "Missing permission" });
            next();
        } catch (e) {
            return res.status(500).json({ message: "Permission check failed" });
        }
    };
}
