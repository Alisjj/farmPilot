/// <reference types="cypress" />

describe("Feed Distribution Activity Flow", () => {
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
                profileImageUrl: null,
                emailVerified: true,
                createdAt: now,
                updatedAt: now,
            },
        }).as("getUser");
        cy.intercept("GET", /\/api\/activities.*/, {
            statusCode: 200,
            body: [],
        }).as("getActivities");
        cy.intercept("POST", "/api/activities/validate", (req) => {
            req.reply({
                statusCode: 201,
                body: {
                    id: "activity-feed-1",
                    activityType: "feed_distribution",
                    location: req.body.location || "Coop A",
                    timestamp: new Date().toISOString(),
                    data: req.body.data || {},
                    userId: "test-user",
                    notes: req.body.notes || "",
                    status: "completed",
                },
            });
        }).as("createFeedActivity");
        cy.visit("/activities");
        cy.wait(["@getUser", "@getActivities"]);
    });

    it("creates a feed distribution activity", () => {
        cy.get('[data-cy="btn-activity-feed_distribution"]').click();
        cy.get('[data-cy="feed-distribution-form"]').should("exist");

        cy.get('[data-cy="feed-type"]').clear().type("Layer Mash");
        cy.get('[data-cy="quantity-kg"]').clear().type("55");
        cy.get('[data-cy="bird-count"]').clear().type("1100");
        cy.get('[data-cy="consumption-rate"]').should("contain.text", "0.0500");

        cy.get('[data-cy="submit-feed"]').click();

        cy.wait("@createFeedActivity");

        // Verify dialog closes
        cy.get('[data-cy="feed-distribution-form"]').should("not.exist");

        // Activity appears in log (may need wait for mutation + refetch)
        cy.contains("Feed Distribution", { timeout: 10000 }).should("exist");
    });
});
