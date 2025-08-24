import { Router } from "express";
import jwt, { SignOptions, Secret, JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Helper function to generate JWT token
function generateToken(payload: { sub: string; role: string; id?: number }) {
  const secret: Secret = (process.env.JWT_SECRET || "dev") as Secret;
  const opts: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "24h") as unknown as number,
  };
  return jwt.sign(payload, secret, opts);
}

// Helper function to verify JWT token
function verifyToken(token: string): JwtPayload | null {
  try {
    const secret: Secret = (process.env.JWT_SECRET || "dev") as Secret;
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err) {
    return null;
  }
}

router.post("/login", async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.fail(400, {
        error: "validation_error",
        details: validation.error.format(),
      });
    }

    const { username, password } = validation.data;

    if (process.env.TEST_BYPASS_AUTH === "true") {
      const token = generateToken({ sub: "dev-user", role: "admin" });
      return res.ok({ token });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return res.fail(401, { error: "invalid_credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash as string);
    if (!match) {
      return res.fail(401, { error: "invalid_credentials" });
    }

    const token = generateToken({
      sub: user.username,
      role: user.role,
      id: user.id,
    });

    return res.ok({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      return res.fail(400, {
        error: "validation_error",
        details: validation.error.format(),
      });
    }

    const { token } = validation.data;
    const payload = verifyToken(token);

    if (!payload) {
      return res.fail(401, { error: "invalid_token" });
    }

    // Verify user still exists and hasn't been disabled
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, payload.sub as string));

      if (!user) {
        return res.fail(401, { error: "user_not_found" });
      }

      // Generate new token with current user data
      const newToken = generateToken({
        sub: user.username,
        role: user.role,
        id: user.id,
      });

      return res.ok({
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } else {
      // Test mode
      const newToken = generateToken({
        sub: payload.sub as string,
        role: payload.role as string,
      });
      return res.ok({ token: newToken });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    // In a real implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Clear any server-side sessions
    // 3. Log the logout event

    // For now, we'll just return success
    // The client should remove the token from storage
    return res.ok({ message: "logout_successful" });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Get current user info
router.get("/me", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.fail(401, { error: "missing_token" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.fail(401, { error: "invalid_token" });
    }

    if (process.env.TEST_BYPASS_AUTH === "true") {
      return res.ok({
        user: {
          id: "test",
          username: payload.sub,
          role: payload.role,
        },
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, payload.sub as string));

    if (!user) {
      return res.fail(401, { error: "user_not_found" });
    }

    return res.ok({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
