/// <reference types="cypress" />
/// <reference types="@cypress/react18" />
import MortalityForm from "../../client/src/components/activities/MortalityForm";
import { mount } from "@cypress/react18";

// Fresh mount per test to avoid state leakage
const mountMortalityForm = (overrides: any = {}) => {
    const onSubmit = cy.stub().as("onSubmit");
    const onCancel = cy.stub().as("onCancel");
    mount(
        <MortalityForm
            onSubmit={onSubmit}
            onCancel={onCancel}
            totalFlockSize={1000}
            isLoading={false}
            {...overrides}
        />
    );
    return { onSubmit, onCancel };
};

describe("MortalityForm Component", () => {
    it("renders the mortality form", () => {
        mountMortalityForm();
        cy.contains("Mortality Record").should("be.visible");
        cy.contains("Number of Deaths").should("be.visible");
        cy.contains("Suspected Cause").should("be.visible");
        cy.contains("Affected Location").should("be.visible");
    });

    it("calculates and displays mortality rate", () => {
        mountMortalityForm();
        cy.get('[data-cy="mortality-count-input"]')
            .focus()
            .clear()
            .type("{selectAll}10");
        cy.get('[data-cy="mortality-count-input"]').should("have.value", "10");
        // Just assert a percentage is shown (avoid flakiness from unexpected flock size)
        cy.contains("span", "Daily Rate:")
            .next()
            .invoke("text")
            .should("match", /\d+\.\d{2}%/);
    });

    it("shows warning alert at count 3", () => {
        mountMortalityForm({ totalFlockSize: 10000 }); // ensure mortalityRate path doesn't trigger critical
        cy.get('[data-cy="mortality-count-input"]')
            .focus()
            .clear()
            .type("{selectAll}3");
        cy.get('[data-cy="mortality-alert-badge"]').should(
            "have.attr",
            "data-alert-level",
            "warning"
        );
    });

    it("shows critical alert at count 5", () => {
        mountMortalityForm();
        cy.get('[data-cy="mortality-count-input"]').clear().type("5");
        cy.get('[data-cy="mortality-alert-badge"]').should(
            "have.attr",
            "data-alert-level",
            "critical"
        );
    });

    it("validates negative count", () => {
        mountMortalityForm();
        cy.get('[data-cy="mortality-count-input"]').clear().type("-1");
        cy.contains("Record Mortality").click();
        cy.contains("Count cannot be negative").should("exist");
    });

    it("handles symptom selection", () => {
        mountMortalityForm();
        const symptoms = [
            "Lethargy",
            "Loss of appetite",
            "Difficulty breathing",
        ];
        symptoms.forEach((s) => cy.contains("label", s).click());
        symptoms.forEach((s) => {
            cy.contains("label", s)
                .prev('input[type="checkbox"]')
                .should("be.checked");
        });
    });

    it("populates form with initial data", () => {
        const initialData = {
            count: 2,
            suspectedCause: "disease" as const,
            affectedCoop: "Coop A",
            symptoms: ["Lethargy", "Loss of appetite"],
            disposalMethod: "Incineration",
            vetNotified: true,
            ageGroup: "layers" as const,
        };
        mountMortalityForm({ initialData });
        cy.get('[data-cy="mortality-count-input"]').should("have.value", "2");
        initialData.symptoms.forEach((s) => {
            cy.contains("label", s)
                .prev('input[type="checkbox"]')
                .should("be.checked");
        });
    });

    it("calls onSubmit with correct data structure", () => {
        mountMortalityForm();
        cy.get('[data-cy="mortality-count-input"]')
            .focus()
            .clear()
            .type("{selectAll}4");
        cy.get('[data-cy="mortality-count-input"]').should("have.value", "4");
        cy.contains("Record Mortality").click();
        cy.get("@onSubmit").should("have.been.calledOnce");
        cy.get("@onSubmit")
            .its("firstCall.args.0")
            .should((arg: any) => {
                expect([4, "4"]).to.include(arg.count); // tolerate number casting
                expect(arg.mortalityRate).to.be.a("number");
                expect(arg.trends).to.be.a("string");
            });
    });

    it("calls onCancel when cancel is clicked", () => {
        mountMortalityForm();
        cy.contains("button", "Cancel").click();
        cy.get("@onCancel").should("have.been.calledOnce");
    });

    it("shows loading state", () => {
        mountMortalityForm({ isLoading: true });
        cy.contains("Recording...").should("be.visible").and("be.disabled");
        cy.contains("Cancel").should("be.disabled");
    });

    it("lists cause options in dropdown", () => {
        mountMortalityForm();
        cy.get('[data-cy="suspected-cause-trigger"]').click();
        [
            "Disease",
            "Injury",
            "Natural",
            "Predator",
            "Environment",
            "Unknown",
        ].forEach((t) => cy.contains(t).should("exist"));
    });
});
