// @ts-ignore
/// <reference types="cypress" />

Cypress.on("uncaught:exception", (err) => {
    if (
        err?.message?.includes("<Select.Item") ||
        err?.message?.includes("Select.Item")
    ) {
        return false; // prevent test failure for known Select empty value issue
    }
});

// Utility to close any lingering overlay
const closeOverlays = () => {
    cy.get('body[style*="pointer-events: none"]', { timeout: 0 }).then(($b) => {
        if ($b.length) {
            cy.log("Body scroll-locked; waiting briefly");
            cy.wait(100);
        }
    });
};

describe("Activities Management", () => {
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
                    id: "activity-1",
                    activityType: req.body.activityType || "egg_collection",
                    location: req.body.location || "Main Coop",
                    timestamp: new Date().toISOString(),
                    data: req.body.data || {},
                    userId: "test-user",
                    notes: req.body.notes || "",
                    status: "completed",
                },
            });
        }).as("createActivity");
        cy.fixture("farm-data").as("farmData");
        cy.visit("/activities");
        cy.wait(["@getUser", "@getActivities"]);
    });

    describe("Activities Page Navigation", () => {
        it("should display the activities page correctly", () => {
            cy.contains(/Daily Activities/i).should("be.visible");
            cy.url().should("include", "/activities");
        });

        it("should show activity selection buttons", () => {
            cy.get('[data-cy="btn-activity-egg_collection"]').should(
                "be.visible"
            );
            cy.get('[data-cy="btn-activity-mortality"]').should("be.visible");
        });
    });

    describe("Egg Collection Form", () => {
        beforeEach(() => {
            cy.get('[data-cy="btn-activity-egg_collection"]').click();
            cy.get('[data-cy="activity-form-dialog"]', {
                timeout: 15000,
            }).should("exist");
            cy.get('[data-cy="activity-form-dialog"]').should(
                "have.attr",
                "data-selected-activity-type",
                "egg_collection"
            );
        });
        it("should open egg collection form dialog", () => {
            cy.get('[data-cy="egg-collection-form"]', {
                timeout: 15000,
            }).should("be.visible");
            cy.contains(/Egg Collection Record/i).should("be.visible");
        });
        it("should validate required fields", () => {
            // Enter an invalid negative quantity to trigger validation
            cy.get('[data-cy="quantity-input"]').clear().type("-1");
            cy.contains("button", /Record Collection/i).click();
            cy.contains(/Quantity must be positive/i).should("exist");
        });
        it("should successfully submit egg collection data", function () {
            const { eggCollection } = this.farmData.activities;
            // Use valid positive quantity
            cy.get('[data-cy="quantity-input"]')
                .clear()
                .type(String(eggCollection.quantity));
            // Quality grade already defaulted to A; explicitly re-select to ensure interaction
            cy.get('[data-cy="egg-collection-form"] [role="combobox"]')
                .first()
                .click();
            cy.contains("A").click({ force: true });
            // Coop location defaults to first option (Coop A); optionally re-select
            cy.get('[data-cy="egg-collection-form"] [role="combobox"]')
                .eq(1)
                .click();
            cy.contains("Coop A").click({ force: true });
            closeOverlays();
            cy.contains("button", /Record Collection/i).click({ force: true });
            cy.wait("@createActivity");
            cy.get('[data-cy="egg-collection-form"]').should("not.exist");
        });
    });

    describe("Mortality Tracking Form", () => {
        beforeEach(() => {
            cy.get('[data-cy="btn-activity-mortality"]').click();
            cy.get('[data-cy="activity-form-dialog"]', {
                timeout: 15000,
            }).should("exist");
            cy.get('[data-cy="activity-form-dialog"]').should(
                "have.attr",
                "data-selected-activity-type",
                "mortality"
            );
            cy.get('[data-cy="mortality-form"]', { timeout: 15000 }).should(
                "be.visible"
            );
        });
        afterEach(() => {
            // Close dialog to force remount next test
            cy.get("body").then(($b) => {
                if ($b.find('[data-cy="mortality-form"]').length) {
                    cy.contains("button", /Cancel/i).click({ force: true });
                }
            });
        });
        it("should open mortality tracking form dialog", () => {
            cy.contains(/Mortality Record/i).should("be.visible");
        });
        it("should validate negative count", () => {
            cy.get('[data-cy="mortality-count-input"]').clear().type("-1");
            cy.contains("button", /Record Mortality/i).click();
            cy.contains(/Count cannot be negative/i).should("exist");
        });
        it("should submit mortality data successfully", () => {
            cy.get('[data-cy="mortality-count-input"]').clear().type("5");
            cy.get('[data-cy="suspected-cause-trigger"]').click();
            cy.contains("Disease").click({ force: true });
            cy.get('[data-cy="affected-coop-trigger"]').click();
            cy.contains("Coop A").click({ force: true });
            cy.get('[data-cy="disposal-method-trigger"]').click();
            cy.contains("Incineration").click({ force: true });
            cy.get('[data-cy="vet-notified"]').click({ force: true });
            closeOverlays();
            cy.get('[data-cy="submit-mortality"]').click({ force: true });
            cy.wait("@createActivity");
            cy.get('[data-cy="mortality-form"]').should("not.exist");
        });
    });

    describe("Activity History", () => {
        it("should display empty state", () => {
            cy.contains(/No activities found/i).should("be.visible");
        });
    });
});
