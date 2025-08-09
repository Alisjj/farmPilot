/// <reference types="cypress" />
/// <reference types="@cypress/react18" />
import FeedDistributionForm from "../../client/src/components/activities/FeedDistributionForm";
import { mount } from "@cypress/react18";

const mountFeedForm = (overrides: any = {}) => {
    const onSubmit = cy.stub().as("onSubmit");
    const onCancel = cy.stub().as("onCancel");
    mount(
        <FeedDistributionForm
            onSubmit={onSubmit}
            onCancel={onCancel}
            isLoading={false}
            {...overrides}
        />
    );
    return { onSubmit, onCancel };
};

describe("FeedDistributionForm Component", () => {
    it("renders required fields", () => {
        mountFeedForm();
        [
            "feed-distribution-form",
            "feed-type",
            "quantity-kg",
            "feeding-time",
            "distribution-method-trigger",
            "feed-quality-trigger",
            "target-section-trigger",
            "bird-count",
            "submit-feed",
        ].forEach((id) => cy.get(`[data-cy="${id}"]`).should("exist"));
    });

    it("shows validation errors when submitting empty", () => {
        mountFeedForm();
        cy.get('[data-cy="feed-type"]').clear();
        cy.get('[data-cy="quantity-kg"]').clear();
        cy.get('[data-cy="bird-count"]').clear();
        cy.get('[data-cy="submit-feed"]').click();
        cy.contains(/Feed type required/i).should("exist");
        cy.contains(/Minimum 0.1 kg/i).should("exist");
        cy.contains(/Bird count required/i).should("exist");
    });

    it("derives consumption rate", () => {
        mountFeedForm();
        cy.get('[data-cy="quantity-kg"]').clear().type("50");
        cy.get('[data-cy="bird-count"]').clear().type("1000");
        cy.get('[data-cy="consumption-rate"]').should("contain.text", "0.0500");
    });

    it("accepts optional numeric fields", () => {
        mountFeedForm();
        cy.get('[data-cy="waste-amount"]').clear().type("1.25");
        cy.get('[data-cy="cost-per-kg"]').clear().type("120.75");
        cy.get('[data-cy="waste-amount"]')
            .invoke("val")
            .then((v) => {
                expect(parseFloat(v as string)).to.be.closeTo(1.25, 0.0001);
            });
        cy.get('[data-cy="cost-per-kg"]')
            .invoke("val")
            .then((v) => {
                expect(parseFloat(v as string)).to.be.closeTo(120.75, 0.0001);
            });
    });

    it("submits structured payload", () => {
        mountFeedForm();
        cy.get('[data-cy="feed-type"]').clear().type("Grower Mash");
        cy.get('[data-cy="quantity-kg"]').clear().type("{selectAll}40");
        cy.get('[data-cy="bird-count"]').clear().type("{selectAll}800");
        cy.get('[data-cy="consumption-rate"]').should("contain.text", "0.0500");
        cy.get('[data-cy="quantity-kg"]')
            .invoke("val")
            .then((raw) => {
                const expectedQty = parseFloat(raw as string);
                cy.get('[data-cy="submit-feed"]').click();
                cy.get("@onSubmit").should("have.been.calledOnce");
                cy.get("@onSubmit")
                    .its("firstCall.args.0")
                    .should((payload: any) => {
                        expect(payload.quantityKg).to.eq(expectedQty);
                        expect([40, 40.0]).to.include(expectedQty);
                        expect(payload.birdCount).to.eq(800);
                        expect(payload.consumptionRate).to.be.closeTo(
                            expectedQty / 800,
                            0.0001
                        );
                    });
            });
    });

    it("calls onCancel", () => {
        mountFeedForm();
        cy.contains("button", "Cancel").click();
        cy.get("@onCancel").should("have.been.calledOnce");
    });

    it("shows loading state", () => {
        mountFeedForm({ isLoading: true });
        cy.get('[data-cy="submit-feed"]')
            .should("be.disabled")
            .and("contain.text", "Recording...");
    });
});
