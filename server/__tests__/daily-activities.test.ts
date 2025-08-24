import request from "supertest";
import db from "../src/db";

describe("Farm Operations", () => {
  beforeEach(() => {
    // Reset mock state before each test
    if (db.__mockState) {
      db.__mockState.selectResponses = [];
      db.__mockState.insertResponse = [];
      db.__mockState.updateResponse = [];
      db.__mockState.deleteResponse = [];
    }
  });

  describe("Daily Activities", () => {
    test("POST /api/daily-activities validates eggs total", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      // Test invalid eggs total (doesn't match sum)
      const res = await request(app)
        .post("/api/daily-activities")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          log_date: "2025-08-23",
          house_id: 1,
          eggs_total: 100,
          eggs_grade_a: 30,
          eggs_grade_b: 20,
          eggs_grade_c: 30, // Sum is 80, not 100
          feed_given_kg: 25.5,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    test("POST /api/daily-activities accepts valid data", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.insertResponse = [
        {
          id: 1,
          log_date: "2025-08-23",
          house_id: 1,
          eggs_total: 80,
          eggs_grade_a: 30,
          eggs_grade_b: 20,
          eggs_grade_c: 30,
          feed_given_kg: "25.50",
        },
      ];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/daily-activities")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          log_date: "2025-08-23",
          house_id: 1,
          eggs_total: 80,
          eggs_grade_a: 30,
          eggs_grade_b: 20,
          eggs_grade_c: 30,
          feed_given_kg: 25.5,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({
        eggs_total: 80,
        eggs_grade_a: 30,
      });
    });

    test("PUT /api/daily-activities/:id updates existing log", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.selectResponses = [
        [{ id: 1, eggs_total: 80 }], // for update query
      ];
      db.default.__mockState.updateResponse = [
        {
          id: 1,
          eggs_total: 90,
          eggs_grade_a: 40,
          eggs_grade_b: 25,
          eggs_grade_c: 25,
        },
      ];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .put("/api/daily-activities/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          eggs_total: 90,
          eggs_grade_a: 40,
          eggs_grade_b: 25,
          eggs_grade_c: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
    });

    test("PUT /api/daily-activities/:id validates eggs total", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .put("/api/daily-activities/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          eggs_total: 90,
          eggs_grade_a: 40,
          eggs_grade_b: 25,
          eggs_grade_c: 20, // Sum is 85, not 90
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    test("DELETE /api/daily-activities/:id removes log", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.deleteResponse = [{ id: 1 }];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .delete("/api/daily-activities/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("deleted", true);
      expect(res.body.data).toHaveProperty("id", 1);
    });
  });

  describe("Houses", () => {
    test("GET /api/houses returns list", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.selectResponses = [
        [
          {
            id: 1,
            house_name: "House A",
            capacity: 1000,
            current_bird_count: 950,
          },
          {
            id: 2,
            house_name: "House B",
            capacity: 800,
            current_bird_count: 750,
          },
        ],
      ];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .get("/api/houses")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({
        house_name: "House A",
        capacity: 1000,
      });
    });

    test("POST /api/houses creates new house", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.insertResponse = [
        { id: 3, house_name: "House C", capacity: 1200, current_bird_count: 0 },
      ];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/houses")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          house_name: "House C",
          capacity: 1200,
          current_bird_count: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toMatchObject({
        house_name: "House C",
        capacity: 1200,
      });
    });

    test("POST /api/houses validates bird count vs capacity", async () => {
      jest.resetModules();
      const { default: app } = await import("../src/app");

      const res = await request(app)
        .post("/api/houses")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          house_name: "House D",
          capacity: 500,
          current_bird_count: 600, // Exceeds capacity
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.error).toHaveProperty(
        "error",
        "current_bird_count_exceeds_capacity"
      );
    });

    test("PUT /api/houses/:id updates house", async () => {
      jest.resetModules();
      const db = await import("../src/db");
      db.default.__mockState.selectResponses = [
        [{ id: 1, capacity: 1000, current_bird_count: 950 }], // existing house for validation
      ];
      db.default.__mockState.updateResponse = [
        { id: 1, capacity: 1100, current_bird_count: 950 }, // updated result
      ];

      const { default: app } = await import("../src/app");

      const res = await request(app)
        .put("/api/houses/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send({
          capacity: 1100,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
    });
  });
});
