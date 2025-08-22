import request from "supertest";
import { app } from "../index";
import { pool } from "../db";

const authHeader = { Authorization: "Bearer test" };

function authed(r: request.Test) {
    return r.set(authHeader);
}

describe("Inventory thresholds & alerts", () => {
    afterAll(async () => {
        await pool.end();
    });

    it("generates alerts once then dedups", async () => {
        const itemRes = await authed(request(app).post("/api/inventory")).send({
            name: "Layer Feed",
            category: "feed",
            unit: "kg",
            currentStock: "40",
            reorderPoint: "100",
            storageLocation: "Main Store",
        });
        expect(itemRes.status).toBe(201);

        const createRes = await authed(
            request(app).post("/api/thresholds")
        ).send({
            thresholdType: "inventory_low_stock_percent",
            thresholdValue: "60",
            comparisonType: "less_than_or_equal",
            alertLevel: "critical",
            notificationChannels: ["dashboard"],
        });
        expect(createRes.status).toBe(201);

        await authed(request(app).get("/api/inventory")).expect(200); // triggers generation
        const alertsFirst = await authed(
            request(app).get("/api/alerts")
        ).expect(200);
        const lowStockFirst = alertsFirst.body.filter(
            (a: any) =>
                a.type === "threshold_exceeded" && /Low Stock/.test(a.title)
        );
        expect(lowStockFirst.length).toBeGreaterThanOrEqual(1);

        await authed(request(app).get("/api/inventory")).expect(200); // potential duplicate
        const alertsSecond = await authed(
            request(app).get("/api/alerts")
        ).expect(200);
        const lowStockSecond = alertsSecond.body.filter(
            (a: any) =>
                a.type === "threshold_exceeded" && /Low Stock/.test(a.title)
        );

        expect(lowStockSecond.length).toBe(lowStockFirst.length);
    });
});
