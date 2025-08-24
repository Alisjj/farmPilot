# Egg Production Management System

## Technical Design Document

**Version:** 1.0  
**Date:** August 24, 2025  
**Project:** Small-Scale Egg Production Management System

---

## 1. Project Overview

### 1.1 Purpose

Design and develop a management system for small-scale egg production operations focusing on cost tracking, sales management, production monitoring, and labor management.

### 1.2 Scope

- Daily production logging by supervisor
- Sales and customer management
- Local feed production cost calculation
- Labor management and payroll system
- Owner dashboard and reporting
- Real-time egg cost calculation and pricing recommendations

### 1.3 Key Stakeholders

- **Primary Users:** Farm Owner, Farm Supervisor
- **Secondary Users:** Farm laborers and future staff members

---

## 2. System Requirements

### 2.1 Functional Requirements

#### 2.1.1 User Management

- **FR-001:** System shall support two user roles: Owner and Supervisor
- **FR-002:** Users shall authenticate via username/password
- **FR-003:** Role-based access control for different features

#### 2.1.2 Daily Operations Logging

- **FR-004:** Supervisor shall log daily egg collection by house/coop
- **FR-005:** System shall record egg quality grades (A, B, C)
- **FR-006:** Supervisor shall record daily feed consumption
- **FR-007:** System shall track daily mortality and health observations
- **FR-008:** All entries shall be timestamped and user-attributed

#### 2.1.3 Sales Management

- **FR-009:** System shall maintain customer database
- **FR-010:** Supervisor shall record daily sales transactions
- **FR-011:** System shall track payment methods and status
- **FR-012:** Different pricing by egg grade shall be supported
- **FR-013:** Sales reports shall be generated automatically

#### 2.1.4 Feed Production Management

- **FR-014:** System shall maintain ingredient inventory and pricing
- **FR-015:** Feed recipes shall be configurable with percentage compositions
- **FR-016:** System shall calculate feed batch costs automatically
- **FR-017:** Cost per kg of produced feed shall be tracked

#### 2.1.5 Labor Management

- **FR-018:** System shall maintain laborer database with personal and employment information
- **FR-019:** Supervisor shall record daily work assignments and attendance
- **FR-020:** System shall track laborer performance and task completion
- **FR-021:** Monthly payroll shall be calculated automatically based on attendance
- **FR-022:** Salary deductions for absences shall be calculated proportionally
- **FR-023:** Bonus payments and adjustments shall be supported
- **FR-024:** Payroll status tracking (pending/paid) shall be maintained
- **FR-025:** Labor cost shall be integrated into egg cost calculations

#### 2.1.6 Cost Calculation Engine

- **FR-026:** System shall calculate real-time cost per egg
- **FR-027:** Feed costs shall be factored into egg cost calculations
- **FR-028:** Labor costs shall be distributed per egg produced
- **FR-029:** Fixed operating costs shall be distributed per egg
- **FR-030:** System shall suggest selling prices based on cost + margin
- **FR-031:** Profit/loss analysis shall be available in real-time

#### 2.1.7 Reporting and Analytics

- **FR-032:** Owner shall access comprehensive dashboard
- **FR-033:** Daily, weekly, and monthly reports shall be generated
- **FR-034:** Production trends and analytics shall be visualized
- **FR-035:** Financial reports showing profitability shall be available
- **FR-036:** Labor reports and payroll summaries shall be available
- **FR-037:** Data export functionality (Excel/PDF) shall be provided

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance

- **NFR-001:** Page load times shall not exceed 3 seconds
- **NFR-002:** System shall support up to 10 concurrent users
- **NFR-003:** Database queries shall complete within 1 second

#### 2.2.2 Usability

- **NFR-004:** Mobile-responsive design for supervisor field use
- **NFR-005:** Intuitive interface requiring minimal training
- **NFR-006:** Offline capability for mobile data entry (sync when online)

#### 2.2.3 Reliability

- **NFR-007:** System uptime shall be 99.5% minimum
- **NFR-008:** Daily automated backups shall be performed
- **NFR-009:** Data integrity validation on all inputs

#### 2.2.4 Security

- **NFR-010:** All passwords shall be encrypted
- **NFR-011:** Session timeout after 24 hours of inactivity
- **NFR-012:** Role-based access enforcement

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Dashboard │    │   API Gateway   │
│  (Supervisor)   │    │    (Owner)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Application    │
                    │     Server      │
                    │                 │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Database     │
                    │   (PostgreSQL)  │
                    │                 │
                    └─────────────────┘
```

### 3.2 Technology Stack

#### 3.2.1 Backend

- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **API Design:** RESTful APIs
- **Validation:** Joi for input validation

#### 3.2.2 Frontend

- **Web Dashboard:** React.js with Material-UI
- **Mobile Interface:** Progressive Web App (PWA)
- **Charts/Visualizations:** Chart.js
- **State Management:** React Context API

#### 3.2.3 Infrastructure

- **Hosting:** VPS or cloud hosting (AWS/DigitalOcean)
- **Database:** Managed PostgreSQL service
- **File Storage:** Local server storage
- **Backup:** Automated daily database backups

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
Users ──┐
        │
        ├── Daily_Logs
        │
        └── Sales
             │
             └── Customers

Feed_Recipes ──── Feed_Batches ──── Batch_Ingredients

Houses ──── Daily_Logs

Operating_Costs ──── Daily_Costs
Bird_Costs ──────── Daily_Costs
```

### 4.2 Database Schema

#### 4.2.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'supervisor')),
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Houses/Coops table
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    house_name VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    current_bird_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily production logs
CREATE TABLE daily_logs (
    id SERIAL PRIMARY KEY,
    log_date DATE NOT NULL,
    house_id INTEGER REFERENCES houses(id),
    eggs_total INTEGER NOT NULL DEFAULT 0,
    eggs_grade_a INTEGER NOT NULL DEFAULT 0,
    eggs_grade_b INTEGER NOT NULL DEFAULT 0,
    eggs_grade_c INTEGER NOT NULL DEFAULT 0,
    feed_given_kg DECIMAL(8,2) NOT NULL DEFAULT 0,
    mortality_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    supervisor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(log_date, house_id)
);

-- Customer management
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    preferred_contact VARCHAR(20) DEFAULT 'phone',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Sales records
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_date DATE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    grade_a_qty INTEGER DEFAULT 0,
    grade_a_price DECIMAL(8,2) DEFAULT 0,
    grade_b_qty INTEGER DEFAULT 0,
    grade_b_price DECIMAL(8,2) DEFAULT 0,
    grade_c_qty INTEGER DEFAULT 0,
    grade_c_price DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'check')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
    supervisor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed recipes
CREATE TABLE feed_recipes (
    id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(100) NOT NULL,
    corn_percent DECIMAL(5,2) NOT NULL,
    soybean_percent DECIMAL(5,2) NOT NULL,
    wheat_bran_percent DECIMAL(5,2) NOT NULL,
    limestone_percent DECIMAL(5,2) NOT NULL,
    other_ingredients JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feed batch production
CREATE TABLE feed_batches (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    batch_size_kg DECIMAL(8,2) NOT NULL,
    recipe_id INTEGER REFERENCES feed_recipes(id),
    total_cost DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredient usage per batch
CREATE TABLE batch_ingredients (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES feed_batches(id),
    ingredient_name VARCHAR(50) NOT NULL,
    amount_kg DECIMAL(8,2) NOT NULL,
    cost_per_kg DECIMAL(8,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL
);

-- Laborers management
CREATE TABLE laborers (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    position VARCHAR(50) NOT NULL, -- General laborer, Feed specialist, etc.
    monthly_salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily work assignments (for tracking, not payment)
CREATE TABLE daily_work_assignments (
    id SERIAL PRIMARY KEY,
    work_date DATE NOT NULL,
    laborer_id INTEGER REFERENCES laborers(id),
    tasks_assigned TEXT[], -- Array of tasks: ['collection', 'feeding', 'cleaning']
    attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'half_day', 'late')),
    performance_notes TEXT,
    supervisor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_date, laborer_id)
);

-- Monthly payroll records
CREATE TABLE monthly_payroll (
    id SERIAL PRIMARY KEY,
    month_year DATE NOT NULL, -- First day of month
    laborer_id INTEGER REFERENCES laborers(id),
    base_salary DECIMAL(10,2) NOT NULL,
    days_worked INTEGER NOT NULL DEFAULT 0,
    days_absent INTEGER NOT NULL DEFAULT 0,
    salary_deductions DECIMAL(8,2) DEFAULT 0, -- For absences or penalties
    bonus_amount DECIMAL(8,2) DEFAULT 0,
    final_salary DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    notes TEXT,
    UNIQUE(month_year, laborer_id)
);

-- Monthly operating costs
CREATE TABLE operating_costs (
    id SERIAL PRIMARY KEY,
    month_year DATE NOT NULL, -- First day of month
    supervisor_salary DECIMAL(10,2) DEFAULT 0,
    total_laborer_salaries DECIMAL(10,2) DEFAULT 0, -- Auto-calculated from payroll
    electricity_cost DECIMAL(10,2) DEFAULT 0,
    water_cost DECIMAL(10,2) DEFAULT 0,
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    other_costs DECIMAL(10,2) DEFAULT 0,
    total_monthly_cost DECIMAL(10,2) NOT NULL,
    UNIQUE(month_year)
);

-- Bird acquisition costs
CREATE TABLE bird_costs (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    birds_purchased INTEGER NOT NULL,
    cost_per_bird DECIMAL(8,2) NOT NULL,
    vaccination_cost_per_bird DECIMAL(8,2) DEFAULT 0,
    expected_laying_months INTEGER DEFAULT 12
);

-- Daily cost calculations (auto-generated)
CREATE TABLE daily_costs (
    id SERIAL PRIMARY KEY,
    cost_date DATE NOT NULL UNIQUE,
    total_feed_cost DECIMAL(10,2) NOT NULL,
    total_eggs_produced INTEGER NOT NULL,
    feed_cost_per_egg DECIMAL(8,4) NOT NULL,
    fixed_cost_per_egg DECIMAL(8,4) NOT NULL,
    health_cost_per_egg DECIMAL(8,4) DEFAULT 0,
    total_cost_per_egg DECIMAL(8,4) NOT NULL,
    suggested_price_grade_a DECIMAL(8,2),
    suggested_price_grade_b DECIMAL(8,2),
    suggested_price_grade_c DECIMAL(8,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_daily_costs_date ON daily_costs(cost_date);

-- Data integrity constraints
ALTER TABLE daily_logs ADD CONSTRAINT chk_eggs_valid
    CHECK (eggs_total = eggs_grade_a + eggs_grade_b + eggs_grade_c);

ALTER TABLE feed_recipes ADD CONSTRAINT chk_recipe_total
    CHECK (corn_percent + soybean_percent + wheat_bran_percent + limestone_percent <= 100);
```

---

## 5. API Design

### 5.1 Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### 5.2 Daily Operations Endpoints

```
GET    /api/daily-logs?date={date}
POST   /api/daily-logs
PUT    /api/daily-logs/{id}
DELETE /api/daily-logs/{id}

GET    /api/houses
POST   /api/houses
```

### 5.3 Sales Management Endpoints

```
GET    /api/sales?date={date}&customer={id}
POST   /api/sales
PUT    /api/sales/{id}

GET    /api/customers
POST   /api/customers
PUT    /api/customers/{id}
```

### 5.4 Feed Management Endpoints

```
GET    /api/feed-recipes
POST   /api/feed-recipes
GET    /api/feed-batches
POST   /api/feed-batches
GET    /api/batch-ingredients/{batch_id}
```

### 5.5 Cost Calculation Endpoints

```
GET    /api/costs/daily/{date}
GET    /api/costs/summary?start={date}&end={date}
POST   /api/costs/operating
GET    /api/costs/egg-price/{date}
```

### 5.6 Labor Management Endpoints

```
GET    /api/laborers
POST   /api/laborers
PUT    /api/laborers/{id}
DELETE /api/laborers/{id}

GET    /api/work-assignments?date={date}&laborer={id}
POST   /api/work-assignments
PUT    /api/work-assignments/{id}

GET    /api/payroll/{month_year}
POST   /api/payroll/generate/{month_year}
PUT    /api/payroll/{id}
GET    /api/payroll/summary?year={year}
```

### 5.7 Reporting Endpoints

```
GET    /api/reports/production?start={date}&end={date}
GET    /api/reports/sales?start={date}&end={date}
GET    /api/reports/financial?start={date}&end={date}
GET    /api/reports/export/{type}?format={csv|pdf}
```

---

## 6. User Interface Design

### 6.1 Mobile Interface (Supervisor)

#### 6.1.1 Daily Entry Screen

```
┌─────────────────────────────────┐
│ Daily Entry - Aug 22, 2025      │
├─────────────────────────────────┤
│ House: [House 1 ▼]              │
│                                 │
│ EGG COLLECTION                  │
│ Grade A: [___] eggs             │
│ Grade B: [___] eggs             │
│ Grade C: [___] eggs             │
│ Total: [___] (auto-calc)        │
│                                 │
│ SALES (Optional)                │
│ Customer: [Select ▼]            │
│ A-Grade: [__] @ ₦[___]/dozen    │
│ B-Grade: [__] @ ₦[___]/dozen    │
│ Payment: [Cash ▼] [Paid ▼]      │
│                                 │
│ FEED & HEALTH                   │
│ Feed Given: [___] kg            │
│ Mortality: [___] birds          │
│ Notes: [____________]           │
│                                 │
│ [Submit Entry]                  │
└─────────────────────────────────┘
```

#### 6.1.2 Feed Batch Creation

```
┌─────────────────────────────────┐
│ New Feed Batch                  │
├─────────────────────────────────┤
│ Recipe: [Layer Mix 1 ▼]         │
│ Batch Size: [___] kg            │
│                                 │
│ INGREDIENTS NEEDED:             │
│ Corn: 40kg @ ₦200/kg = ₦8,000   │
│ Soybean: 25kg @ ₦300/kg = ₦7,500│
│ Wheat Bran: 20kg @ ₦150/kg = ₦3k│
│ Limestone: 10kg @ ₦100/kg = ₦1k │
│ Premix: 5kg @ ₦500/kg = ₦2,500  │
│                                 │
│ Total Cost: ₦22,000             │
│ Cost/kg: ₦220                   │
│                                 │
│ [Create Batch]                  │
└─────────────────────────────────┘
```

#### 6.1.3 Daily Worker Assignment Screen

```
┌─────────────────────────────────┐
│ Daily Worker Check-In           │
├─────────────────────────────────┤
│ Date: Aug 24, 2025              │
│                                 │
│ WORKER ATTENDANCE:              │
│ ✓ John Doe (General Laborer)    │
│   Tasks: [✓] Collection         │
│           [✓] Cleaning          │
│   Status: [Present ▼]           │
│                                 │
│ ✓ Mary Jane (Feed Specialist)   │
│   Tasks: [✓] Feed Prep          │
│           [✓] Feeding           │
│   Status: [Present ▼]           │
│                                 │
│ ✗ Peter Paul (General)          │
│   Status: [Absent ▼]            │
│   Reason: [Sick leave]          │
│                                 │
│ Notes: Mary did excellent job   │
│ with feed preparation today     │
│                                 │
│ [Submit Daily Assignment]       │
└─────────────────────────────────┘
```

### 6.2 Web Dashboard (Owner)

#### 6.2.1 Main Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Egg Farm Dashboard - Today: Aug 22, 2025                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TODAY'S SUMMARY                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │Eggs: 420    │ │Sales: ₦15k  │ │Cost: ₦12.5  │            │
│ │+5% vs yest. │ │20 dozens    │ │per egg      │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                             │
│ PRODUCTION TREND (7 days)                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │     ●                                                   │ │
│ │   ●   ●                                                 │ │
│ │ ●       ●                                               │ │
│ │           ● ●                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ QUICK ACTIONS                                               │
│ [View Today's Entries] [Sales Report] [Cost Analysis]      │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Cost Analysis Screen

```
┌─────────────────────────────────────────────────────────────┐
│ Cost Analysis - Aug 22, 2025                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ EGG COST BREAKDOWN                                          │
│ Feed Cost:        ₦8.50 per egg (68%)                      │
│ Fixed Costs:      ₦2.80 per egg (22%)                      │
│ Health Costs:     ₦0.70 per egg (6%)                       │
│ Other Costs:      ₦0.50 per egg (4%)                       │
│ ────────────────────────────────────                       │
│ Total Cost:       ₦12.50 per egg                           │
│                                                             │
│ PRICING RECOMMENDATIONS                                     │
│ Grade A (Break-even + 20%): ₦18/egg = ₦216/dozen          │
│ Grade B (Break-even + 15%): ₦17/egg = ₦204/dozen          │
│ Grade C (Break-even + 10%): ₦16/egg = ₦192/dozen          │
│                                                             │
│ CURRENT PROFITABILITY                                       │
│ If selling A-grade at ₦20/egg: ₦7.50 profit per egg       │
│ Monthly projected profit: ₦94,500                          │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.3 Monthly Payroll Screen (Owner)

```
┌─────────────────────────────────────────────────────────────┐
│ Monthly Payroll - August 2025                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ PAYROLL SUMMARY                                             │
│ Total Laborers: 4                                          │
│ Total Monthly Salaries: ₦180,000                           │
│                                                             │
│ INDIVIDUAL RECORDS:                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ John Doe (General Laborer)                              │ │
│ │ Base Salary: ₦45,000                                    │ │
│ │ Days Worked: 26/26    Absent: 0 days                   │ │
│ │ Deductions: ₦0        Bonus: ₦0                        │ │
│ │ Final Pay: ₦45,000    Status: [Paid ▼]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mary Jane (Feed Specialist)                             │ │
│ │ Base Salary: ₦50,000                                    │ │
│ │ Days Worked: 24/26    Absent: 2 days                   │ │
│ │ Deductions: ₦3,846    Bonus: ₦0                        │ │
│ │ Final Pay: ₦46,154    Status: [Pending ▼]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Generate Payroll] [Export to PDF] [Mark All Paid]         │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Key Algorithms

### 7.1 Daily Cost Calculation

```javascript
function calculateDailyCost(date) {
  // Get daily production data
  const dailyLogs = getDailyLogs(date);
  const totalEggs = dailyLogs.reduce((sum, log) => sum + log.eggs_total, 0);

  // Calculate feed cost
  const feedCost = calculateFeedCost(date);
  const feedCostPerEgg = feedCost / totalEggs;

  // Calculate monthly labor cost distributed daily
  const monthlyLaborCosts = getMonthlyLaborCosts(date);
  const daysInMonth = getDaysInMonth(date);
  const avgDailyProduction = getAverageMonthlyProduction(date) / daysInMonth;
  const laborCostPerEgg = monthlyLaborCosts / daysInMonth / avgDailyProduction;

  // Calculate other fixed costs (supervisor, utilities, etc.)
  const monthlyOperatingCosts =
    getMonthlyOperatingCosts(date) - monthlyLaborCosts;
  const fixedCostPerEgg =
    monthlyOperatingCosts / daysInMonth / avgDailyProduction;

  // Calculate health costs (bird costs distributed over laying period)
  const healthCostPerEgg = calculateHealthCostPerEgg(date);

  const totalCostPerEgg =
    feedCostPerEgg + laborCostPerEgg + fixedCostPerEgg + healthCostPerEgg;

  return {
    feedCostPerEgg,
    laborCostPerEgg,
    fixedCostPerEgg,
    healthCostPerEgg,
    totalCostPerEgg,
    suggestedPrices: {
      gradeA: totalCostPerEgg * 1.25, // 25% markup
      gradeB: totalCostPerEgg * 1.2, // 20% markup
      gradeC: totalCostPerEgg * 1.15, // 15% markup
    },
  };
}
```

### 7.2 Feed Batch Cost Calculation

```javascript
function calculateFeedBatchCost(recipe, batchSizeKg, ingredientPrices) {
  let totalCost = 0;
  const ingredients = [];

  // Calculate each ingredient cost
  for (const [ingredient, percentage] of Object.entries(recipe)) {
    const amountKg = (batchSizeKg * percentage) / 100;
    const cost = amountKg * ingredientPrices[ingredient];

    ingredients.push({
      name: ingredient,
      amountKg,
      costPerKg: ingredientPrices[ingredient],
      totalCost: cost,
    });

    totalCost += cost;
  }

  return {
    batchSizeKg,
    totalCost,
    costPerKg: totalCost / batchSizeKg,
    ingredients,
  };
}
```

### 7.3 Monthly Payroll Calculation

```javascript
function calculateMonthlyPayroll(laborerId, monthYear) {
  // Get laborer details
  const laborer = getLaborerById(laborerId);
  const baseSalary = laborer.monthly_salary;

  // Get attendance records for the month
  const workAssignments = getWorkAssignmentsByMonth(laborerId, monthYear);
  const daysInMonth = getDaysInMonth(monthYear);
  const workingDaysInMonth = getWorkingDaysInMonth(monthYear); // Exclude Sundays

  // Calculate attendance
  const daysWorked = workAssignments.filter(
    (assignment) => assignment.attendance_status === "present"
  ).length;

  const halfDays = workAssignments.filter(
    (assignment) => assignment.attendance_status === "half_day"
  ).length;

  const daysAbsent = workingDaysInMonth - daysWorked - halfDays * 0.5;

  // Calculate proportional salary
  const dailySalary = baseSalary / workingDaysInMonth;
  const salaryDeductions =
    daysAbsent * dailySalary + halfDays * 0.5 * dailySalary;

  // Calculate final salary
  const earnedSalary = baseSalary - salaryDeductions;
  const bonusAmount = calculateBonusAmount(laborer, workAssignments);
  const finalSalary = earnedSalary + bonusAmount;

  return {
    laborerId,
    monthYear,
    baseSalary,
    daysWorked: daysWorked + halfDays * 0.5,
    daysAbsent,
    salaryDeductions,
    bonusAmount,
    finalSalary,
    paymentStatus: "pending",
  };
}

function calculateBonusAmount(laborer, workAssignments) {
  // Performance-based bonus calculation
  const excellentPerformanceDays = workAssignments.filter(
    (assignment) =>
      assignment.performance_notes &&
      assignment.performance_notes.toLowerCase().includes("excellent")
  ).length;

  // ₦500 bonus per excellent performance day
  return excellentPerformanceDays * 500;
}
```

---

## 8. Development Phases

### 8.1 Phase 1: Core MVP (4-6 weeks)

**Deliverables:**

- User authentication system
- Basic daily logging interface
- Simple feed batch cost calculator
- Basic owner dashboard
- Database setup and core APIs

**Success Criteria:**

- Supervisor can log daily production
- Owner can view production summaries
- Feed costs can be calculated

### 8.2 Phase 2: Sales & Advanced Features (3-4 weeks)

**Deliverables:**

- Customer management system
- Sales recording and tracking
- Payment status monitoring
- Enhanced reporting features
- Mobile-responsive design

**Success Criteria:**

- Complete sales workflow functional
- Customer database operational
- Reports generate correctly

### 8.3 Phase 3: Cost Analysis & Optimization (2-3 weeks)

**Deliverables:**

- Real-time cost calculation engine
- Pricing recommendation system
- Advanced analytics and charts
- Data export functionality
- Performance optimization

**Success Criteria:**

- Accurate cost per egg calculations
- Pricing recommendations working
- System performance meets requirements

---

## 9. Testing Strategy

### 9.1 Unit Testing

- All API endpoints
- Cost calculation algorithms
- Data validation functions
- Authentication logic

### 9.2 Integration Testing

- Database operations
- API integration with frontend
- Cost calculation workflows
- Report generation

### 9.3 User Acceptance Testing

- Supervisor daily workflow
- Owner dashboard functionality
- Mobile interface usability
- Report accuracy verification

### 9.4 Performance Testing

- Load testing with simulated data
- Database query performance
- Mobile interface responsiveness

---

## 10. Deployment Strategy

### 10.1 Development Environment

- Local development with Docker
- PostgreSQL in container
- Hot reload for development

### 10.2 Staging Environment

- Replica of production environment
- Test data for UAT
- Automated testing pipeline

### 10.3 Production Deployment

- VPS or cloud hosting setup
- Managed PostgreSQL database
- SSL certificate installation
- Automated backup configuration
- Monitoring and logging setup

### 10.4 Rollback Strategy

- Database backup before deployment
- Previous version containerized
- Quick rollback procedure documented

---

## 11. Maintenance & Support

### 11.1 Regular Maintenance

- Daily automated backups
- Weekly database optimization
- Monthly security updates
- Quarterly feature reviews

### 11.2 Monitoring

- Application performance monitoring
- Database performance tracking
- Error logging and alerting
- User activity analytics

### 11.3 Support Procedures

- User training documentation
- Troubleshooting guide
- Bug reporting process
- Feature request handling

---

## 12. Future Enhancements

### 12.1 Short-term (3-6 months)

- Mobile app (native iOS/Android)
- Automated SMS notifications
- Advanced analytics dashboard
- Inventory management for other supplies

### 12.2 Long-term (6-12 months)

- IoT sensor integration
- Weather data integration
- Multi-farm management
- Accounting software integration
- Customer mobile app for orders

---

## 13. Risk Assessment

### 13.1 Technical Risks

- **Database corruption:** Mitigated by daily backups and replication
- **Performance issues:** Addressed through proper indexing and caching
- **Security vulnerabilities:** Regular security audits and updates

### 13.2 Business Risks

- **User adoption:** Mitigated by simple, intuitive interface design
- **Data accuracy:** Input validation and supervisor training
- **System downtime:** Redundant hosting and quick recovery procedures

### 13.3 Mitigation Strategies

- Comprehensive testing at each phase
- Regular user feedback collection
- Documentation and training materials
- Emergency response procedures

---

**Document Status:** Draft  
**Next Review:** September 1, 2025  
**Approval Required:** Farm Owner

## 14. Implementation updates

Date: August 22, 2025

This section records concrete repository and implementation changes made while aligning the codebase to this design. It is intended as a living changelog for the rebuild.

### 14.1 Summary

- Archived the existing implementation to `legacy/` (moved original `client/` and `server/` directories). A script `scripts/archive_legacy.sh` was added to perform the archival and commit. A local Git tag `pre-rebuild-2025-08-22` was created.
- Converted the repository into a pnpm workspace (root `package.json` updated, `pnpm-workspace.yaml` and `WORKSPACES.md` added). Dependencies were bootstrapped with `pnpm install`.
- Introduced a minimal backend scaffold (`server/src/index.ts`, `server/src/db.ts`) wired to Drizzle ORM and PostgreSQL.

### 14.2 Database & migrations

- Drizzle-based schema source added/updated at `shared/schema.ts` to reflect the design tables. Key schema changes include:
  - `daily_logs` table (replacing legacy daily activities naming).
  - Normalized ingredient model: `ingredients` catalog + `recipe_ingredients` join table (percentage composition). Removed hard-coded ingredient percent columns from `feed_recipes`.
  - `batch_ingredients` normalized to reference `ingredient_id` and store `amount_kg`, `cost_per_kg`, and `total_cost`.
- Migrations created:
  - `migrations/0000_init.sql` — auto-generated from the prior DB state (snapshot of original schema).
  - `migrations/0001_design_schema.sql` — manual SQL migration created from this design to reliably apply the new design schema.

### 14.3 Local dev environment

- Development used the system PostgreSQL instance (port 5432 already in use). A dev database `farmpilot_dev` and user `farmpilot` (password `farmpilot`) were created for local development and granted privileges.
- `drizzle-kit` was used to generate and push migrations to the local dev DB. One generation run triggered interactive rename prompts; to avoid blocking, the canonical design migration (`0001_design_schema.sql`) was created manually.

### 14.4 Code changes and validation

- Server routes and TypeScript code have been progressively updated to match the new schema names. Example: `server/src/routes/dailyActivities.ts` was updated to use `daily_logs` and to coerce decimal fields (`feed_given_kg`) to strings for Drizzle compatibility; file-level TypeScript checks pass for that file.
- Shared validation is currently implemented ad-hoc (some Zod schemas inline in routes); plan is to move reusable validators into `shared/` for reuse by client and server.

### 14.5 Git / remote status

- All archival and scaffold commits and a local tag were created. Attempted `git push` for the `rebuild/design-v1` branch and tags failed with HTTP 403 (remote permissions). The pushes remain pending on the user's environment or on corrected remote credentials.

### 14.6 Tests / checks performed

- `pnpm install` completed for the workspace. TypeScript checks have been run iteratively; several issues were fixed (package.json linting, Drizzle typing, JWT typing). Ongoing: full workspace `tsc` should be re-run and remaining route files reconciled.
- `drizzle-kit push` applied changes to the local dev DB after the DB user was created.

### 14.7 Outstanding items / next steps

1. Finish migrating server code to the new schema names and move shared Zod validators into `shared/` for reuse. Run: `pnpm -w -s exec tsc --noEmit` and fix remaining type errors.
2. Decide migration workflow (manual SQL migrations vs. non-interactive Drizzle diffs). If continuing with Drizzle diffs, the interactive rename prompts must be resolved manually when generating migrations.
3. Add seed scripts (owner user, sample houses, sample ingredients/recipes) and wire a `dev:seed` script in `package.json`.
4. Push the `rebuild/design-v1` branch and tags to remote (requires correct credentials or permission fixes).
5. Implement API endpoints per the design and add unit/integration tests (Cypress E2E already present in the repo; adapt tests to new API paths if names change).

### 14.8 Coverage mapping (high level)

- Design -> Schema: Done (schema in `shared/schema.ts`, normalized ingredients).
- Schema -> Migrations: Partially done (manual `0001_design_schema.sql` created; auto-diff generation was interactive and deferred).
- API -> Server: In progress (some routes updated; full reconciliation pending).
- Dev infra (pnpm, Docker compose): pnpm workspace setup done; docker-compose dev DB left unused due to local Postgres conflict.

### 14.9 Where to look (useful paths)

- `shared/schema.ts` — canonical Drizzle schema for the design
- `migrations/0001_design_schema.sql` — manual migration derived from the design
- `scripts/archive_legacy.sh` — archival script used to move legacy code to `legacy/`
- `server/src/routes/` — server routes being migrated to the new schema
- `pnpm-workspace.yaml`, root `package.json` — workspace config and scripts

---

---
