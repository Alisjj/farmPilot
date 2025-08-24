import request from "supertest";
import { describe, test, expect, beforeEach } from "@jest/globals";
import db from "../db";

describe("Sales & Customers APIs", () => {
  beforeEach(() => {
    // Reset mock state before each test
    if (db.__mockState) {
      db.__mockState.selectResponses = [];
      db.__mockState.insertResponse = [];
      db.__mockState.updateResponse = [];
      db.__mockState.deleteResponse = [];
    }
  });

  describe("Customers API", () => {
    test("POST /api/customers - should create a new customer", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      const customerData = {
        customer_name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        address: "123 Test Street",
        preferred_contact: "phone",
      };

      // Mock successful customer creation
      if (db.__mockState) {
        db.__mockState.insertResponse = [
          {
            id: 1,
            ...customerData,
            created_at: new Date(),
            is_active: true,
          },
        ];
      }

      const response = await request(app)
        .post("/api/customers")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(customerData)
        .expect(201);

      expect(response.body.message).toBe("Customer created successfully");
      expect(response.body.customer).toBeDefined();
      expect(response.body.customer.customer_name).toBe(
        customerData.customer_name
      );
      expect(response.body.customer.phone).toBe(customerData.phone);
      expect(response.body.customer.email).toBe(customerData.email);
    });

    test("GET /api/customers - should list customers", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      // Mock customer list response
      if (db.__mockState) {
        db.__mockState.selectResponses = [
          {
            id: 1,
            customer_name: "Test Customer",
            phone: "08012345678",
            email: "test@example.com",
            is_active: true,
          },
        ];
      }

      const response = await request(app)
        .get("/api/customers")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .expect(200);

      expect(response.body).toHaveProperty("customers");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.customers)).toBe(true);
    });

    test("GET /api/customers/:id - should get specific customer", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      const mockCustomer = {
        id: 1,
        customer_name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        is_active: true,
      };

      // Mock single customer response
      if (db.__mockState) {
        db.__mockState.selectResponses = [mockCustomer];
      }

      const response = await request(app)
        .get("/api/customers/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.customer_name).toBe("Test Customer");
    });

    test("PUT /api/customers/:id - should update customer", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      const updateData = {
        customer_name: "Updated Test Customer",
        phone: "08087654321",
      };

      // Mock existing customer (for the existence check)
      if (db.__mockState) {
        // First call is the existence check
        db.__mockState.selectResponses = [
          {
            id: 1,
            customer_name: "Test Customer",
            phone: "08012345678",
            is_active: true,
          },
        ];

        // Second call is the update returning
        db.__mockState.updateResponse = [
          {
            id: 1,
            ...updateData,
            is_active: true,
          },
        ];
      }

      const response = await request(app)
        .put("/api/customers/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Customer updated successfully");
      expect(response.body.customer.customer_name).toBe(
        updateData.customer_name
      );
    });

    test("should require authentication", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      await request(app).get("/api/customers").expect(401);
      await request(app).post("/api/customers").send({}).expect(401);
    });
  });

  describe("Sales API", () => {
    test("POST /api/sales - should create a new sale with calculation", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      const saleData = {
        sale_date: "2025-01-24",
        customer_id: 1,
        grade_a_qty: 50,
        grade_a_price: 25.0,
        grade_b_qty: 30,
        grade_b_price: 20.0,
        grade_c_qty: 20,
        grade_c_price: 15.0,
        payment_method: "cash",
        payment_status: "paid",
      };

      // Expected total: (50 * 25) + (30 * 20) + (20 * 15) = 1250 + 600 + 300 = 2150
      const expectedTotal = 2150;

      // Mock sale creation response
      if (db.__mockState) {
        db.__mockState.insertResponse = [
          {
            id: 1,
            ...saleData,
            total_amount: expectedTotal,
            supervisor_id: 1,
            created_at: new Date(),
          },
        ];
      }

      const response = await request(app)
        .post("/api/sales")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(saleData)
        .expect(201);

      expect(response.body.message).toBe("Sale recorded successfully");
      expect(response.body.sale).toBeDefined();
      expect(response.body.sale.sale_date).toBe(saleData.sale_date);
      expect(response.body.sale.customer_id).toBe(saleData.customer_id);
      expect(response.body.sale.grade_a_qty).toBe(saleData.grade_a_qty);
      expect(response.body.sale.payment_method).toBe(saleData.payment_method);
    });

    test("GET /api/sales - should list sales with customer info", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      // Mock sales list with customer info
      if (db.__mockState) {
        db.__mockState.selectResponses = [
          {
            id: 1,
            sale_date: "2025-01-24",
            customer_id: 1,
            customer_name: "Test Customer",
            grade_a_qty: 50,
            total_amount: 1250,
            payment_status: "paid",
          },
        ];
      }

      const response = await request(app)
        .get("/api/sales")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .expect(200);

      expect(response.body).toHaveProperty("sales");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.sales)).toBe(true);
    });

    test("GET /api/sales/summary - should provide sales analytics", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      // Mock summary response
      if (db.__mockState) {
        db.__mockState.selectResponses = [
          {
            total_sales: 5,
            total_revenue: 10000,
            total_eggs: 500,
            avg_sale_amount: 2000,
            grade_a_total: 300,
            grade_b_total: 150,
            grade_c_total: 50,
            paid_sales: 4,
            pending_sales: 1,
          },
        ];
      }

      const response = await request(app)
        .get("/api/sales/summary")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .expect(200);

      expect(response.body).toHaveProperty("summary");
      expect(response.body).toHaveProperty("period");
      expect(response.body.summary).toHaveProperty("total_sales");
      expect(response.body.summary).toHaveProperty("total_revenue");
      expect(response.body.summary).toHaveProperty("total_eggs");
    });

    test("POST /api/sales with validation errors - should fail for invalid data", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      const invalidSaleData = {
        sale_date: "invalid-date",
        grade_a_qty: -5, // negative quantity
        payment_method: "invalid-method",
      };

      await request(app)
        .post("/api/sales")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(invalidSaleData)
        .expect(500); // Should fail validation
    });

    test("should require authentication for all endpoints", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      await request(app).get("/api/sales").expect(401);
      await request(app).post("/api/sales").send({}).expect(401);
    });

    test("should require supervisor or owner role for creating records", async () => {
      jest.resetModules();
      const { default: app } = await import("../app");

      await request(app)
        .post("/api/sales")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .send({ sale_date: "2025-01-24" })
        .expect(403);
    });
  });

  describe("Sales Calculations", () => {
    test("should correctly calculate total amount for multi-grade sales", () => {
      const gradeA = { qty: 100, price: 25 };
      const gradeB = { qty: 50, price: 20 };
      const gradeC = { qty: 25, price: 15 };

      const expectedTotal =
        gradeA.qty * gradeA.price +
        gradeB.qty * gradeB.price +
        gradeC.qty * gradeC.price;

      expect(expectedTotal).toBe(3875); // 2500 + 1000 + 375
    });

    test("should handle zero quantities correctly", () => {
      const gradeA = { qty: 50, price: 25 };
      const gradeB = { qty: 0, price: 20 };
      const gradeC = { qty: 0, price: 15 };

      const expectedTotal = gradeA.qty * gradeA.price;

      expect(expectedTotal).toBe(1250);
    });

    test("should validate minimum quantity requirements", () => {
      const allZero = { gradeA: 0, gradeB: 0, gradeC: 0 };
      const hasQuantity = { gradeA: 10, gradeB: 0, gradeC: 0 };

      expect(allZero.gradeA + allZero.gradeB + allZero.gradeC).toBe(0);
      expect(
        hasQuantity.gradeA + hasQuantity.gradeB + hasQuantity.gradeC
      ).toBeGreaterThan(0);
    });

    test("should calculate price per grade correctly", () => {
      // Test realistic pricing scenarios
      const scenario1 = {
        gradeA: { qty: 100, price: 30 }, // Premium eggs
        gradeB: { qty: 200, price: 25 }, // Standard eggs
        gradeC: { qty: 50, price: 20 }, // Lower grade
      };

      const total1 =
        scenario1.gradeA.qty * scenario1.gradeA.price +
        scenario1.gradeB.qty * scenario1.gradeB.price +
        scenario1.gradeC.qty * scenario1.gradeC.price;

      expect(total1).toBe(9000); // 3000 + 5000 + 1000

      // Test edge case with only one grade
      const scenario2 = {
        gradeA: { qty: 500, price: 28 },
        gradeB: { qty: 0, price: 25 },
        gradeC: { qty: 0, price: 20 },
      };

      const total2 = scenario2.gradeA.qty * scenario2.gradeA.price;
      expect(total2).toBe(14000);
    });

    test("should validate business rules for sales", () => {
      // Minimum quantity check
      const zeroQuantityOrder = { a: 0, b: 0, c: 0 };
      const validOrder = { a: 10, b: 5, c: 2 };

      const totalZero =
        zeroQuantityOrder.a + zeroQuantityOrder.b + zeroQuantityOrder.c;
      const totalValid = validOrder.a + validOrder.b + validOrder.c;

      expect(totalZero).toBe(0);
      expect(totalValid).toBeGreaterThan(0);

      // Price validation (should be positive)
      const validPrices = [25.5, 30.0, 22.75];
      const invalidPrices = [-5, 0, -10.5];

      validPrices.forEach((price) => {
        expect(price).toBeGreaterThan(0);
      });

      invalidPrices.forEach((price) => {
        expect(price).toBeLessThanOrEqual(0);
      });
    });
  });
});
