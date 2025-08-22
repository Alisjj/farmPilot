import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8)
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});

// Environment variables validation
if (!process.env.JWT_SECRET) {
    throw new Error("Environment variable JWT_SECRET not provided");
}

if (!process.env.SESSION_SECRET) {
    throw new Error("Environment variable SESSION_SECRET not provided");
}

// Constants
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Rate limiting
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts per window
//   message: { message: "Too many login attempts, please try again later" },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const generalLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // 100 requests per window
//     message: { message: "Too many requests, please try again later" },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// JWT utilities
interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

function generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer: "farm-harvest-app",
        audience: "farm-harvest-users",
    });
}

function generateRefreshToken(): string {
    return jwt.sign({}, process.env.JWT_SECRET!, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: "farm-harvest-app",
        audience: "farm-harvest-users",
    });
}

function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: "farm-harvest-app",
        audience: "farm-harvest-users",
    }) as JWTPayload;
}

// Password utilities
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Session configuration
export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
    });
    return session({
        secret: process.env.SESSION_SECRET!,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
            sameSite: "strict",
        },
    });
}

// Auth setup
export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());
    // app.use(generalLimiter);

    // Login route
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = loginSchema.parse(req.body);

            // Get user
            const user = await storage.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Check if account is locked
            if (user.lockedUntil && new Date() < user.lockedUntil) {
                return res.status(423).json({
                    message:
                        "Account temporarily locked due to too many failed attempts",
                    lockedUntil: user.lockedUntil,
                });
            }

            // Verify password
            const isValid = await verifyPassword(password, user.password);
            if (!isValid) {
                // Increment failed attempts
                await storage.incrementFailedAttempts(user.id);

                // Lock account if too many failed attempts
                if (
                    (user.failedLoginAttempts || 0) + 1 >=
                    MAX_FAILED_ATTEMPTS
                ) {
                    await storage.lockUser(
                        user.id,
                        new Date(Date.now() + LOCKOUT_TIME)
                    );
                    return res.status(423).json({
                        message:
                            "Account locked due to too many failed attempts",
                    });
                }

                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Reset failed attempts and update last login
            await storage.resetFailedAttempts(user.id);
            await storage.updateLastLogin(user.id);

            // Generate tokens
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email!,
                role: user.role!,
            });

            const refreshToken = generateRefreshToken();

            // Store refresh token (revoke old ones)
            await storage.revokeUserRefreshTokens(user.id);
            await storage.createRefreshToken({
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            // Set tokens in HTTP-only cookies
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Login error:", error);
            if (error instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ message: "Invalid input", errors: error.errors });
            }
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Refresh token route
    app.post("/api/auth/refresh", async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res
                    .status(401)
                    .json({ message: "Refresh token not provided" });
            }

            // Verify refresh token
            try {
                verifyToken(refreshToken);
            } catch (error) {
                return res
                    .status(401)
                    .json({ message: "Invalid refresh token" });
            }

            // Check if refresh token exists in database and is not revoked
            const storedToken = await storage.getRefreshToken(refreshToken);
            if (
                !storedToken ||
                storedToken.isRevoked ||
                new Date() > storedToken.expiresAt
            ) {
                return res
                    .status(401)
                    .json({ message: "Invalid or expired refresh token" });
            }

            // Get user
            const user = await storage.getUser(storedToken.userId);
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Generate new tokens
            const newAccessToken = generateAccessToken({
                userId: user.id,
                email: user.email!,
                role: user.role!,
            });

            const newRefreshToken = generateRefreshToken();

            // Revoke old refresh token and create new one
            await storage.revokeRefreshToken(refreshToken);
            await storage.createRefreshToken({
                userId: user.id,
                token: newRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            // Set new tokens in cookies
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({ message: "Tokens refreshed successfully" });
        } catch (error) {
            console.error("Token refresh error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // Logout route
    app.post("/api/auth/logout", async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (refreshToken) {
                // Revoke the refresh token
                await storage.revokeRefreshToken(refreshToken);
            }

            // Clear cookies
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            res.json({ message: "Logged out successfully" });
        } catch (error) {
            console.error("Logout error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
    // Test bypass for backend unit/integration tests
    if (process.env.TEST_BYPASS_AUTH === "true") {
        (req as any).user = {
            id: "test-user",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            role: "admin", // simplified roles: admin | staff
        };
        return next();
    }

    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res
                .status(401)
                .json({ message: "Access token not provided" });
        }

        try {
            const payload = verifyToken(accessToken);

            // Get user to ensure they still exist and aren't locked
            const user = await storage.getUser(payload.userId);
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            if (user.lockedUntil && new Date() < user.lockedUntil) {
                return res.status(423).json({ message: "Account is locked" });
            }

            // Attach user info to request
            (req as any).user = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            };

            next();
        } catch (jwtError) {
            return res
                .status(401)
                .json({ message: "Invalid or expired access token" });
        }
    } catch (error) {
        console.error("Authentication middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
