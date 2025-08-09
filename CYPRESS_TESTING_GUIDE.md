# Cypress Testing Setup for Farm Harvest

## 🚀 **Testing Framework Overview**

Farm Harvest now includes comprehensive **Cypress testing framework** for both **E2E (End-to-End)** and **Component testing**:

### **Testing Structure**

```
cypress/
├── e2e/                 # End-to-end tests
│   ├── 01-landing.cy.ts     # Landing page tests
│   └── 02-activities.cy.ts  # Activities functionality tests
├── component/           # Component tests
│   └── MortalityForm.cy.tsx # MortalityForm component tests
├── fixtures/           # Test data
│   └── farm-data.json      # Sample farm data for tests
├── support/            # Test utilities
│   ├── commands.ts         # Custom commands
│   ├── e2e.ts             # E2E test setup
│   ├── component.ts       # Component test setup
│   └── component-index.html # Component test HTML template
└── cypress.config.ts   # Cypress configuration
```

---

## 📋 **Available Test Commands**

### **Run All Tests**

```bash
npm test                    # Run all tests in headless mode
npm run test:headed         # Run all tests with browser visible
```

### **Interactive Testing**

```bash
npm run test:open           # Open Cypress Test Runner GUI
```

### **Specific Test Types**

```bash
npm run test:e2e           # Run only E2E tests
npm run test:component     # Run only component tests
```

### **Verify Installation**

```bash
npm run cypress:verify     # Verify Cypress installation
```

---

## 🎯 **Test Coverage**

### **E2E Tests**

#### **Landing Page Tests** (`01-landing.cy.ts`)

-   ✅ **Page rendering**: Verifies landing page displays correctly
-   ✅ **Navigation functionality**: Tests navigation elements
-   ✅ **Responsive design**: Tests multiple viewport sizes
-   ✅ **404 handling**: Tests graceful error handling

#### **Activities Management Tests** (`02-activities.cy.ts`)

-   ✅ **Page navigation**: Activities page loads correctly
-   ✅ **Activity selection**: Egg Collection and Mortality buttons
-   ✅ **Alert center**: Real-time alert display
-   ✅ **Form validation**: Required field validation
-   ✅ **Data submission**: Complete form workflows
-   ✅ **Alert generation**: High mortality alert testing
-   ✅ **Symptom selection**: Multiple symptom checkbox handling
-   ✅ **Real-time updates**: Loading states and form interactions

### **Component Tests**

#### **MortalityForm Component Tests** (`MortalityForm.cy.tsx`)

-   ✅ **Component rendering**: Form displays all required fields
-   ✅ **Mortality rate calculation**: Automatic percentage calculation
-   ✅ **Alert system**: Critical/warning alerts for different mortality levels
-   ✅ **Form validation**: Required field validation
-   ✅ **Symptom selection**: Multiple checkbox interaction
-   ✅ **Initial data population**: Pre-filled form handling
-   ✅ **Data structure**: Correct onSubmit data format
-   ✅ **Loading states**: Button states during submission
-   ✅ **Color coding**: Cause-based visual indicators

---

## 🔧 **Custom Commands**

### **Data Selectors**

```typescript
cy.dataCy("element-name"); // Select by data-cy attribute
```

### **Authentication**

```typescript
cy.login("username", "password"); // Custom login command
```

### **Navigation**

```typescript
cy.navigateToSection("activities"); // Navigate to farm sections
```

---

## 📊 **Test Data**

### **Sample Data Structure** (`fixtures/farm-data.json`)

```json
{
    "users": {
        "admin": { "username": "admin", "role": "administrator" },
        "supervisor": { "username": "supervisor", "role": "supervisor" }
    },
    "activities": {
        "eggCollection": {
            "quantity": 245,
            "qualityGrade": "A",
            "coopLocation": "Main Coop"
        },
        "mortality": {
            "count": 3,
            "suspectedCause": "disease",
            "symptoms": ["Lethargy", "Loss of appetite"]
        }
    },
    "farmData": {
        "totalFlockSize": 1000,
        "alertThresholds": {
            "mortalityDaily": 5,
            "mortalityRate": 2.0
        }
    }
}
```

---

## 🚨 **Alert System Testing**

### **Mortality Alert Scenarios**

-   **Normal**: 1-2 birds → No alert
-   **Warning**: 3-4 birds → Yellow warning alert
-   **Critical**: 5+ birds → Red critical alert with management notification

### **Test Coverage**

```typescript
// Test critical alert threshold
cy.get('input[type="number"]').type("5");
cy.contains("Critical Alert").should("be.visible");

// Test warning alert threshold
cy.get('input[type="number"]').type("3");
cy.contains("Warning").should("be.visible");
```

---

## 📈 **Enhanced Testing Features**

### **Form Validation Testing**

-   **Required field validation**: Tests all mandatory fields
-   **Data type validation**: Number inputs, dropdown selections
-   **Business rule validation**: Mortality thresholds, productivity limits

### **Real-time Feature Testing**

-   **Alert center updates**: Real-time alert display
-   **Form calculations**: Automatic mortality rate and productivity calculations
-   **Loading states**: Button states during API calls

### **Responsive Design Testing**

```typescript
// Test multiple viewports
cy.viewport("iphone-x"); // Mobile testing
cy.viewport("ipad-2"); // Tablet testing
cy.viewport(1280, 720); // Desktop testing
```

---

## 🛠 **Configuration**

### **Cypress Configuration** (`cypress.config.ts`)

```typescript
{
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
}
```

### **Environment Settings**

-   **Base URL**: `http://localhost:3000`
-   **Viewport**: 1280x720 default
-   **Timeouts**: 10 second default
-   **Video recording**: Enabled for test runs
-   **Screenshots**: Captured on test failures

---

## 🎬 **Test Execution Flow**

### **Development Workflow**

1. **Start development server**: `npm run dev`
2. **Open Cypress GUI**: `npm run test:open`
3. **Run specific tests**: Select tests in GUI
4. **Debug failures**: Use browser dev tools in Cypress

### **CI/CD Integration**

1. **Install dependencies**: `npm ci`
2. **Build application**: `npm run build`
3. **Start server**: `npm start` (background)
4. **Run tests**: `npm test`
5. **Generate reports**: Videos and screenshots saved

---

## 📝 **Best Practices**

### **Test Organization**

-   **Descriptive test names**: Clear, specific test descriptions
-   **Grouped scenarios**: Related tests in describe blocks
-   **Fixture data**: Centralized test data management
-   **Custom commands**: Reusable test utilities

### **Assertion Strategies**

-   **Element visibility**: Verify UI elements are displayed
-   **Data validation**: Check form submissions and calculations
-   **Error handling**: Test validation and error states
-   **User workflows**: Complete user journey testing

### **Maintenance**

-   **Regular updates**: Keep tests aligned with feature changes
-   **Data cleanup**: Reset test state between runs
-   **Selector stability**: Use data-cy attributes for reliable selectors
-   **Test isolation**: Independent tests that don't rely on order

---

## 🚀 **Next Steps**

### **Immediate Actions**

1. **Run installation verification**: `npm run cypress:verify`
2. **Start development server**: `npm run dev`
3. **Open test runner**: `npm run test:open`
4. **Execute sample tests**: Run landing and activities tests

### **Expansion Opportunities**

-   **Additional E2E tests**: Dashboard, inventory, reports pages
-   **Component test coverage**: EggCollectionForm, AlertCenter components
-   **API testing**: Backend endpoint testing
-   **Performance testing**: Load and stress testing
-   **Accessibility testing**: A11y compliance verification

---

**Cypress testing framework is now fully integrated with Farm Harvest Phase 1 implementation!** 🎉

**Ready for comprehensive testing of enhanced daily activity recording system with structured forms, alert management, and real-time calculations.**
