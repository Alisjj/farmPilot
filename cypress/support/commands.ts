// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import Testing Library commands
import "@testing-library/cypress/add-commands";

// Declare custom commands
declare global {
    namespace Cypress {
        interface Chainable {
            dataCy(value: string): Chainable<JQuery<HTMLElement>>;
            login(username: string, password: string): Chainable<Element>;
            navigateToSection(section: string): Chainable<Element>;
            findByLabelText(
                text: string | RegExp
            ): Chainable<JQuery<HTMLElement>>;
            findByRole(
                role: string,
                options?: { name?: string | RegExp }
            ): Chainable<JQuery<HTMLElement>>;

            // Activity Management Commands
            recordEggCollection(
                quantity: number,
                grade: string
            ): Chainable<Element>;
            recordMortality(count: number, cause: string): Chainable<Element>;
            recordFeedDistribution(
                type: string,
                quantity: number
            ): Chainable<Element>;

            // Employee Management Commands
            addEmployee(employeeData: any): Chainable<Element>;
            processPayroll(employeeId: string): Chainable<Element>;

            // Financial Management Commands
            recordTransaction(
                type: string,
                amount: number,
                category: string
            ): Chainable<Element>;
            createPurchaseOrder(supplierData: any): Chainable<Element>;

            // Health Management Commands
            recordHealthObservation(observation: any): Chainable<Element>;
            scheduleVeterinaryVisit(visitData: any): Chainable<Element>;

            // Inventory Management Commands
            updateInventoryStock(
                itemId: string,
                quantity: number
            ): Chainable<Element>;
            setReorderThreshold(
                itemId: string,
                threshold: number
            ): Chainable<Element>;

            // Dashboard and Reporting Commands
            generateReport(
                reportType: string,
                filters: any
            ): Chainable<Element>;
            verifyKpiCard(
                kpiName: string,
                expectedValue: string | number
            ): Chainable<Element>;
            exportData(format: string): Chainable<Element>;
        }
    }
}

// Custom command to select elements by data-cy attribute
Cypress.Commands.add("dataCy", (value: string) => {
    return cy.get(`[data-cy=${value}]`);
});

// Custom command to login
Cypress.Commands.add("login", (username: string, password: string) => {
    cy.session([username, password], () => {
        cy.visit("/login");
        cy.findByLabelText(/username|email/i).type(username);
        cy.findByLabelText(/password/i).type(password);
        cy.findByRole("button", { name: /login|sign in/i }).click();
        cy.url().should("not.include", "/login");
    });
});

// Custom command to navigate to farm sections
Cypress.Commands.add("navigateToSection", (section: string) => {
    const sectionMap: Record<string, string> = {
        // Core Application Sections
        dashboard: "/dashboard",
        activities: "/activities",
        inventory: "/inventory",
        employees: "/employees",
        health: "/health",
        finances: "/finances",
        reports: "/reports",

        // Authentication Sections
        login: "/login",
        logout: "/logout",

        // Specific Dashboard Tabs
        "dashboard-overview": "/dashboard?tab=overview",
        "dashboard-executive": "/dashboard?tab=executive",
        "dashboard-operations": "/dashboard?tab=operations",

        // Activity Sub-sections
        "activities-egg-collection": "/activities?view=egg-collection",
        "activities-feed-distribution": "/activities?view=feed-distribution",
        "activities-mortality": "/activities?view=mortality",
        "activities-medication": "/activities?view=medication",
        "activities-sales": "/activities?view=sales",

        // Health Sub-sections
        "health-monitoring": "/health?view=monitoring",
        "health-veterinary": "/health?view=veterinary",
        "health-medication": "/health?view=medication",
        "health-biosecurity": "/health?view=biosecurity",

        // Employee Sub-sections
        "employees-directory": "/employees?view=directory",
        "employees-payroll": "/employees?view=payroll",
        "employees-performance": "/employees?view=performance",
        "employees-schedules": "/employees?view=schedules",

        // Finance Sub-sections
        "finances-transactions": "/finances?view=transactions",
        "finances-procurement": "/finances?view=procurement",
        "finances-analysis": "/finances?view=analysis",
        "finances-budgets": "/finances?view=budgets",

        // Inventory Sub-sections
        "inventory-stock": "/inventory?view=stock",
        "inventory-supplies": "/inventory?view=supplies",
        "inventory-feed": "/inventory?view=feed",
        "inventory-medicine": "/inventory?view=medicine",

        // Reports Sub-sections
        "reports-production": "/reports?type=production",
        "reports-financial": "/reports?type=financial",
        "reports-health": "/reports?type=health",
        "reports-analytics": "/reports?type=analytics",
    };

    const path = sectionMap[section];
    if (!path) {
        throw new Error(
            `Unknown section: ${section}. Available sections: ${Object.keys(
                sectionMap
            ).join(", ")}`
        );
    }

    cy.visit(path);
    cy.url().should("include", path.split("?")[0]); // Handle query parameters
});

// ========================================
// ACTIVITY MANAGEMENT COMMANDS
// ========================================

// Record egg collection activity
Cypress.Commands.add(
    "recordEggCollection",
    (quantity: number, grade: string) => {
        cy.navigateToSection("activities-egg-collection");
        cy.findByLabelText(/quantity/i)
            .clear()
            .type(quantity.toString());
        cy.findByLabelText(/grade/i).select(grade);
        cy.findByRole("button", { name: /save|record|submit/i }).click();
        cy.contains(/success|recorded|saved/i).should("be.visible");
    }
);

// Record mortality data with alert threshold checking
Cypress.Commands.add("recordMortality", (count: number, cause: string) => {
    cy.navigateToSection("activities-mortality");
    cy.findByLabelText(/count|number/i)
        .clear()
        .type(count.toString());
    cy.findByLabelText(/cause/i).select(cause);
    cy.findByRole("button", { name: /save|record|submit/i }).click();

    // Check for threshold alerts if count > 5
    if (count > 5) {
        cy.contains(/alert|warning|threshold/i).should("be.visible");
    }
});

// Record feed distribution
Cypress.Commands.add(
    "recordFeedDistribution",
    (type: string, quantity: number) => {
        cy.navigateToSection("activities-feed-distribution");
        cy.findByLabelText(/feed type|type/i).select(type);
        cy.findByLabelText(/quantity|amount/i)
            .clear()
            .type(quantity.toString());
        cy.findByRole("button", { name: /save|record|submit/i }).click();
        cy.contains(/success|recorded|saved/i).should("be.visible");
    }
);

// ========================================
// EMPLOYEE MANAGEMENT COMMANDS
// ========================================

// Add new employee with comprehensive data
Cypress.Commands.add("addEmployee", (employeeData: any) => {
    cy.navigateToSection("employees");
    cy.findByRole("button", { name: /add|new employee/i }).click();

    // Fill personal information
    cy.findByLabelText(/name|full name/i).type(employeeData.name);
    cy.findByLabelText(/email/i).type(employeeData.email);
    cy.findByLabelText(/phone/i).type(employeeData.phone);

    // Fill employment information
    cy.findByLabelText(/role|position/i).select(employeeData.role);
    cy.findByLabelText(/department/i).select(employeeData.department);
    cy.findByLabelText(/salary/i).type(employeeData.salary.toString());

    cy.findByRole("button", { name: /save|create|add/i }).click();
    cy.contains(/success|created|added/i).should("be.visible");
});

// Process payroll for employee
Cypress.Commands.add("processPayroll", (employeeId: string) => {
    cy.navigateToSection("employees-payroll");
    cy.dataCy(`employee-${employeeId}`).within(() => {
        cy.findByRole("button", { name: /process|pay/i }).click();
    });
    cy.contains(/payroll processed|payment completed/i).should("be.visible");
});

// ========================================
// FINANCIAL MANAGEMENT COMMANDS
// ========================================

// Record financial transaction
Cypress.Commands.add(
    "recordTransaction",
    (type: string, amount: number, category: string) => {
        cy.navigateToSection("finances-transactions");
        cy.findByRole("button", { name: /add|new transaction/i }).click();

        cy.findByLabelText(/type/i).select(type);
        cy.findByLabelText(/amount/i)
            .clear()
            .type(amount.toString());
        cy.findByLabelText(/category/i).select(category);

        cy.findByRole("button", { name: /save|record|submit/i }).click();
        cy.contains(/success|recorded|saved/i).should("be.visible");
    }
);

// Create purchase order
Cypress.Commands.add("createPurchaseOrder", (supplierData: any) => {
    cy.navigateToSection("finances-procurement");
    cy.findByRole("button", { name: /purchase order|new order/i }).click();

    cy.findByLabelText(/supplier/i).select(supplierData.supplier);
    cy.findByLabelText(/item/i).type(supplierData.item);
    cy.findByLabelText(/quantity/i).type(supplierData.quantity.toString());
    cy.findByLabelText(/price|cost/i).type(supplierData.price.toString());

    cy.findByRole("button", { name: /create|submit/i }).click();
    cy.contains(/order created|success/i).should("be.visible");
});

// ========================================
// HEALTH MANAGEMENT COMMANDS
// ========================================

// Record health observation
Cypress.Commands.add("recordHealthObservation", (observation: any) => {
    cy.navigateToSection("health-monitoring");
    cy.findByRole("button", { name: /add|record observation/i }).click();

    cy.findByLabelText(/observation type/i).select(observation.type);
    cy.findByLabelText(/severity/i).select(observation.severity);
    cy.findByLabelText(/notes|description/i).type(observation.notes);

    cy.findByRole("button", { name: /save|record/i }).click();
    cy.contains(/recorded|saved/i).should("be.visible");
});

// Schedule veterinary visit
Cypress.Commands.add("scheduleVeterinaryVisit", (visitData: any) => {
    cy.navigateToSection("health-veterinary");
    cy.findByRole("button", { name: /schedule|book visit/i }).click();

    cy.findByLabelText(/date/i).type(visitData.date);
    cy.findByLabelText(/veterinarian/i).select(visitData.vet);
    cy.findByLabelText(/purpose/i).type(visitData.purpose);

    cy.findByRole("button", { name: /schedule|book/i }).click();
    cy.contains(/scheduled|booked/i).should("be.visible");
});

// ========================================
// INVENTORY MANAGEMENT COMMANDS
// ========================================

// Update inventory stock levels
Cypress.Commands.add(
    "updateInventoryStock",
    (itemId: string, quantity: number) => {
        cy.navigateToSection("inventory-stock");
        cy.dataCy(`inventory-item-${itemId}`).within(() => {
            cy.findByLabelText(/quantity|stock/i)
                .clear()
                .type(quantity.toString());
            cy.findByRole("button", { name: /update|save/i }).click();
        });
        cy.contains(/updated|saved/i).should("be.visible");
    }
);

// Set reorder threshold for inventory item
Cypress.Commands.add(
    "setReorderThreshold",
    (itemId: string, threshold: number) => {
        cy.navigateToSection("inventory-stock");
        cy.dataCy(`inventory-item-${itemId}`).within(() => {
            cy.findByRole("button", { name: /settings|configure/i }).click();
        });
        cy.findByLabelText(/threshold|minimum/i)
            .clear()
            .type(threshold.toString());
        cy.findByRole("button", { name: /save|update/i }).click();
        cy.contains(/threshold set|updated/i).should("be.visible");
    }
);

// ========================================
// DASHBOARD AND REPORTING COMMANDS
// ========================================

// Generate report with filters
Cypress.Commands.add("generateReport", (reportType: string, filters: any) => {
    cy.navigateToSection(`reports-${reportType}`);

    // Apply filters if provided
    if (filters.dateFrom) {
        cy.findByLabelText(/from date|start date/i).type(filters.dateFrom);
    }
    if (filters.dateTo) {
        cy.findByLabelText(/to date|end date/i).type(filters.dateTo);
    }
    if (filters.section) {
        cy.findByLabelText(/section|location/i).select(filters.section);
    }

    cy.findByRole("button", { name: /generate|create report/i }).click();
    cy.contains(/report generated|success/i).should("be.visible");
});

// Verify KPI card displays correct value
Cypress.Commands.add(
    "verifyKpiCard",
    (kpiName: string, expectedValue: string | number) => {
        cy.navigateToSection("dashboard-executive");
        cy.dataCy(`kpi-${kpiName.toLowerCase().replace(/\s+/g, "-")}`).within(
            () => {
                cy.contains(expectedValue.toString()).should("be.visible");
            }
        );
    }
);

// Export data in specified format
Cypress.Commands.add("exportData", (format: string) => {
    cy.findByRole("button", { name: /export/i }).click();
    cy.findByRole("menuitem", { name: new RegExp(format, "i") }).click();

    // Verify download started or success message
    cy.contains(/download|export/i).should("be.visible");
});
