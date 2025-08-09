// ***********************************************************
// This example support/component.ts file is processed and
// loaded automatically before your component test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Import React and mount command
import { mount } from "@cypress/react18";

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount;
        }
    }
}

Cypress.Commands.add("mount", mount);

// Import global styles that your component tests may need
import "../../client/src/index.css";
