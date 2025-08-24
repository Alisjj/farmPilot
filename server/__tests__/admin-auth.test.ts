import request from "supertest";
import app from "../src/app";

describe("Admin Authentication", () => {
  test("unauthenticated requests should be rejected", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
  });

  test("authenticated non-admin should be forbidden", async () => {
    // Set TEST_BYPASS_AUTH=true in setupEnv; send x-test-role header to set role
    const res = await request(app)
      .get("/api/admin/users")
      .set("authorization", "Bearer fake")
      .set("x-test-role", "staff");
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("success", false);
  });

  test("authenticated admin should get a paginated response", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("authorization", "Bearer fake")
      .set("x-test-role", "admin");
    // The route queries DB; we only assert envelope and shape (DB may be empty)
    expect([200, 200]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty("meta");
      expect(res.body.data).toHaveProperty("items");
    }
  });
});
