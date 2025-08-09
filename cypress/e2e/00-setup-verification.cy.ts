describe("Cypress Setup Verification", () => {
    it("should verify Cypress is working correctly", () => {
        // Just a basic test to ensure Cypress can run
        expect(true).to.be.true;

        // Test that we can use Cypress commands
        cy.wrap("Farm Harvest").should("contain", "Farm");

        // Test custom fixture loading
        cy.fixture("farm-data").then((data) => {
            expect(data).to.have.property("users");
            expect(data).to.have.property("activities");
            expect(data).to.have.property("farmData");
        });
    });

    it("should be able to visit the application", () => {
        cy.visit("/");
        cy.get("body").should("exist");
    });
});
