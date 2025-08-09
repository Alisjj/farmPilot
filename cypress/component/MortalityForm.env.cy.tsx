/// <reference types="cypress" />
/// <reference types="@cypress/react18" />
import MortalityForm from "../../client/src/components/activities/MortalityForm";
import { mount } from "@cypress/react18";

describe("MortalityForm Environmental Fields", () => {
    it("submits with environmental data", () => {
        const onSubmit = cy.stub().as("onSubmit");
        mount(
            <MortalityForm
                onSubmit={onSubmit}
                onCancel={() => {}}
                totalFlockSize={1000}
                isLoading={false}
            />
        );

        cy.get('[data-cy="mortality-count-input"]').clear().type("6");
        cy.get('[data-cy="temp-input"]').type("28");
        cy.get('[data-cy="humidity-input"]').type("65");
        // Skip conditions select (optional) to avoid portal flakiness

        cy.contains("Record Mortality").click();
        cy.get("@onSubmit").should("have.been.calledOnce");
        cy.get("@onSubmit")
            .its("firstCall.args.0")
            .should((payload: any) => {
                expect(payload.temperatureC).to.eq(28);
                expect(payload.humidityPct).to.eq(65);
            });
    });
});
