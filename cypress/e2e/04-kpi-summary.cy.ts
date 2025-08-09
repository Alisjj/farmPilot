/// <reference types="cypress" />

// Uses inline loader so tabs present immediately; intercept metrics without hard wait.

describe("Executive KPI Summary", () => {
    it("displays KPI summary cards with stubbed data", () => {
        const now = new Date().toISOString();
        cy.intercept("GET", "/api/auth/user", {
            statusCode: 200,
            body: {
                id: "test-user",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                role: "supervisor",
                profileImageUrl: null,
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            },
        }).as("getUser");
        cy.intercept("GET", "/api/dashboard/metrics", {
            statusCode: 200,
            delay: 50,
            body: {
                mortality: 2,
                recentActivities: [],
                totalEmployees: 10,
                activeEmployeesCount: 8,
                lowStockItems: [],
            },
        }).as("getMetrics");
        cy.intercept("GET", "/api/kpi/summary", {
            statusCode: 200,
            body: {
                date: "2025-08-09",
                revenue: 150000,
                expenses: 40000,
                profitMargin: 60,
                eggs: 8200,
                mortalityRate: 1.2,
                fcr: 1.85,
                alerts: { total: 3, critical: 1, high: 1, medium: 1, low: 0 },
                lastUpdated: "2025-08-09T10:00:00Z",
            },
        }).as("getKpi");

        cy.visit("/dashboard");
        cy.wait("@getUser");
        cy.get('[data-cy="tab-executive"]').should("be.visible").click();
        cy.wait("@getKpi");

        cy.contains("Revenue")
            .parent()
            .within(() => {
                cy.contains("₦150,000");
            });
        cy.contains("Eggs Collected").parent().contains("8200");
        cy.contains("Mortality Rate").parent().contains("1.20%");
        cy.contains("Feed Conversion Ratio").parent().contains("1.85");
        cy.contains("Profit Margin").parent().contains("60.00%");
        cy.contains("Alerts (Critical)").parent().contains("1");
    });
});
