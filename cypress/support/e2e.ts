// ***********************************************************
// This example support/e2e.ts file is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom assertions
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-cy attribute.
             * @example cy.dataCy('greeting')
             */
            dataCy(value: string): Chainable<Element>;

            /**
             * Custom command to login a user
             * @example cy.login('admin', 'password')
             */
            login(username: string, password: string): Chainable<void>;

            /**
             * Custom command to navigate to a specific farm section
             * @example cy.navigateToSection('dashboard')
             */
            navigateToSection(section: string): Chainable<void>;
        }
    }
}

// Prevent TypeScript from reading file as legacy script
export {};
