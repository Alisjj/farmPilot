import request from "supertest";

// helper to create a mock db with queued select responses and an optional insert response
function makeMockDb(selectResponses: any[][] = [], insertResponse?: any[]) {
  const responses = [...selectResponses];
  return {
    select: (_sel?: any) => ({
      from: () => ({
        where: () => ({
          then: (fn: any) => Promise.resolve(responses.shift() || []).then(fn),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve(insertResponse || []),
      }),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  } as any;
}

describe("Admin Users CRUD", () => {
  test("POST /api/admin/users creates a user", async () => {
    jest.resetModules();
    // Use the built-in test db mock and seed its state
    const db = await import("../src/db");
    db.default.__mockState.insertResponse = [
      { id: 2, username: "newuser", role: "staff", full_name: "" },
    ];

    const { default: app } = await import("../src/app");

    const res = await request(app)
      .post("/api/admin/users")
      .set("authorization", "Bearer fake")
      .set("x-test-role", "admin")
      .send({ username: "newuser", password: "secret1", role: "staff" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toMatchObject({ username: "newuser", role: "staff" });
  });

  test("PUT demote last admin is prevented", async () => {
    jest.resetModules();
    const db = await import("../src/db");
    db.default.__mockState.selectResponses = [[{ id: 10, role: "admin" }], []];

    const { default: app } = await import("../src/app");

    const res = await request(app)
      .put("/api/admin/users/10/role")
      .set("authorization", "Bearer fake")
      .set("x-test-role", "admin")
      .send({ role: "staff" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("error", "cannot_demote_last_admin");
  });
});
