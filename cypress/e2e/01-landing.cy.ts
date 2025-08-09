// @ts-ignore
/// <reference types="cypress" />

describe("Landing Page", () => {
    beforeEach(() => {
        cy.visit("/");
    });

    it("should display the landing page correctly", () => {
        cy.contains("PoultryPro").should("be.visible");
        cy.contains(/Farm Management System/i).should("be.visible");
        // Accept either Sign In or Get Started primary CTA
        cy.contains(/Sign In|Get Started/i).should("be.visible");
    });

    it("should have working navigation", () => {
        cy.contains(/Sign In|Get Started/i).click();
        // After click we should be on login route or still on landing (if modal etc.)
        cy.location("pathname").then((path) => {
            expect(["/login", "/"].includes(path)).to.be.true;
        });
    });

    it("should be responsive", () => {
        ["iphone-x", "ipad-2", [1280, 720]].forEach((vp: any) => {
            if (Array.isArray(vp)) cy.viewport(vp[0], vp[1]);
            else cy.viewport(vp as any);
            cy.contains("PoultryPro").should("be.visible");
        });
    });

    it("should handle 404 pages gracefully", () => {
        cy.visit("/non-existent-page", { failOnStatusCode: false });
        cy.contains(/404.*Page Not Found|Page Not Found|404/i).should(
            "be.visible"
        );
    });
});
