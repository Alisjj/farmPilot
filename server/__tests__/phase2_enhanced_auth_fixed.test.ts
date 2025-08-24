import request from "supertest";
import jwt from "jsonwebtoken";
import db from "../src/db";

describe("Phase 2: Enhanced Authentication", () => {
  beforeEach(() => {
    // Reset mock state before each test
    if (db.__mockState) {
      db.__mockState.selectResponses = [];
      db.__mockState.insertResponse = [];
    }
  });

  describe("POST /api/auth/login", () => {
    test("validates required fields", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "validation_error");
    });

    test("validates username is provided", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "validation_error");
    });

    test("validates password is provided", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "testuser" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "validation_error");
    });

    test("returns token in test bypass mode", async () => {
      jest.resetModules();
      process.env.TEST_BYPASS_AUTH = "true";
      const { default: app } = await import("../src/app");

      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("token");

      // Verify token is valid JWT
      const token = res.body.data.token;
      const decoded = jwt.decode(token) as any;
      expect(decoded).toHaveProperty("sub", "dev-user");
      expect(decoded).toHaveProperty("role", "admin");
    });

    test("handles invalid credentials", async () => {
      jest.resetModules();
      delete process.env.TEST_BYPASS_AUTH;
      const db = await import("../src/db");
      db.default.__mockState.selectResponses = [[]]; // Empty result = user not found

      const { default: app } = await import("../src/app");

      const res = await request(app).post("/api/auth/login").send({
        username: "nonexistent",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "invalid_credentials");
    });
  });

  describe("POST /api/auth/refresh", () => {
    test("validates token is provided", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app).post("/api/auth/refresh").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("details");
      expect(res.body.error.details.token._errors[0]).toBe("Required");
    });

    test("handles invalid token", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ token: "invalid.jwt.token" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "invalid_token");
    });

    test("refreshes valid token in test mode", async () => {
      jest.resetModules();
      process.env.TEST_BYPASS_AUTH = "true";

      // Create a valid token first
      const originalToken = jwt.sign(
        { sub: "testuser", role: "supervisor" },
        process.env.JWT_SECRET || "dev",
        { expiresIn: "1h" }
      );

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ token: originalToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("token");

      // New token should be different but have same payload
      const newToken = res.body.data.token;
      expect(newToken).not.toBe(originalToken);

      const decoded = jwt.decode(newToken) as any;
      expect(decoded).toHaveProperty("sub", "testuser");
      expect(decoded).toHaveProperty("role", "supervisor");
    });
  });

  describe("POST /api/auth/logout", () => {
    test("returns success", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app).post("/api/auth/logout").send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("message", "logout_successful");
    });
  });

  describe("GET /api/auth/me", () => {
    test("requires authorization header", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "missing_token");
    });

    test("validates token format", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .get("/api/auth/me")
        .set("authorization", "InvalidToken");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "missing_token");
    });

    test("handles invalid token", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .get("/api/auth/me")
        .set("authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty("error", "invalid_token");
    });

    test("returns user info with valid token in test mode", async () => {
      jest.resetModules();
      process.env.TEST_BYPASS_AUTH = "true";

      const token = jwt.sign(
        { sub: "testuser", role: "supervisor" },
        process.env.JWT_SECRET || "dev",
        { expiresIn: "1h" }
      );

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .get("/api/auth/me")
        .set("authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data.user).toMatchObject({
        id: "test",
        username: "testuser",
        role: "supervisor",
      });
    });
  });
});
