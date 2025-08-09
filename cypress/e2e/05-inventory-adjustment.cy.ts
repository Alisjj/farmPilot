/// <reference types="cypress" />

// E2E: Inventory stock adjustment (restock & consume) with optimistic UI

describe("Inventory Adjustments", () => {
    beforeEach(() => {
        const now = new Date().toISOString();
        cy.intercept("GET", "/api/auth/user", {
            statusCode: 200,
            body: {
                id: "test-user",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                role: "supervisor",
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            },
        }).as("getUser");
    });

    it("creates restock and consumption adjustments updating stock", () => {
        // Seed inventory list
        cy.intercept("GET", "/api/inventory", {
            statusCode: 200,
            body: [
                {
                    id: "item-1",
                    name: "Layer Feed",
                    category: "feed",
                    currentStock: "100",
                    reorderPoint: "80",
                    unit: "kg",
                    unitCost: "1.50",
                    expirationDate: null,
                    storageLocation: "Warehouse A",
                },
            ],
        }).as("getInventory");

        cy.intercept("POST", "/api/inventory/item-1/adjust", (req) => {
            // Echo back minimal adjustment
            req.reply({
                statusCode: 201,
                body: {
                    id: "adj-1",
                    itemId: "item-1",
                    adjustmentType: req.body.adjustmentType,
                    quantity: req.body.quantity,
                    reason: req.body.reason || null,
                    createdAt: new Date().toISOString(),
                },
            });
        }).as("adjustStock");

        cy.visit("/inventory");
        cy.wait(["@getUser", "@getInventory"]);

        // Open adjust dialog
        cy.get('[data-cy="adjust-item-1"]').click();
        cy.contains("Adjust Stock - Layer Feed").should("be.visible");

        // Restock +25
        cy.get('input[type="number"]').first().clear().type("25");
        cy.contains("Save Adjustment").click();
        cy.wait("@adjustStock");

        // Stock cell should reflect optimistic update (100 + 25 = 125)
        cy.contains("Layer Feed")
            .parent("tr")
            .within(() => {
                cy.contains("125 kg");
            });

        // Consume 10
        cy.get('[data-cy="adjust-item-1"]').click();
        cy.get('[role="combobox"]').click();
        cy.contains("Consume").click();
        cy.get('input[type="number"]').first().clear().type("10");
        cy.contains("Save Adjustment").click();
        cy.wait("@adjustStock");

        // New stock: 125 - 10 = 115
        cy.contains("Layer Feed")
            .parent("tr")
            .within(() => {
                cy.contains("115 kg");
            });
    });
});
