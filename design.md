# Egg Production Management System

## Technical Design Document

**Version:** 1.0  
**Date:** August 22, 2025  
**Project:** Small-Scale Egg Production Management System

---

## 1. Project Overview

### 1.1 Purpose

Design and develop a management system for small-scale egg production operations focusing on cost tracking, sales management, and production monitoring.

### 1.2 Scope

- Daily production logging by supervisor
- Sales and customer management
- Local feed production cost calculation
- Owner dashboard and reporting
- Real-time egg cost calculation and pricing recommendations

### 1.3 Key Stakeholders

- **Primary Users:** Farm Owner, Farm Supervisor
- **Secondary Users:** Future staff members

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

#### 2.1.5 Cost Calculation Engine

- **FR-018:** System shall calculate real-time cost per egg
- **FR-019:** Feed costs shall be factored into egg cost calculations
- **FR-020:** Fixed operating costs shall be distributed per egg
- **FR-021:** System shall suggest selling prices based on cost + margin
- **FR-022:** Profit/loss analysis shall be available in real-time

#### 2.1.6 Reporting and Analytics

- **FR-023:** Owner shall access comprehensive dashboard
- **FR-024:** Daily, weekly, and monthly reports shall be generated
- **FR-025:** Production trends and analytics shall be visualized
- **FR-026:** Financial reports showing profitability shall be available
- **FR-027:** Data export functionality (Excel/PDF) shall be provided

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

-- Monthly operating costs
CREATE TABLE operating_costs (
    id SERIAL PRIMARY KEY,
    month_year DATE NOT NULL, -- First day of month
    supervisor_salary DECIMAL(10,2) DEFAULT 0,
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

### 5.6 Reporting Endpoints

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

  // Calculate fixed costs (monthly costs distributed daily)
  const monthlyOperatingCosts = getMonthlyOperatingCosts(date);
  const daysInMonth = getDaysInMonth(date);
  const avgDailyProduction = getAverageMonthlyProduction(date) / daysInMonth;
  const fixedCostPerEgg =
    monthlyOperatingCosts / daysInMonth / avgDailyProduction;

  // Calculate health costs (bird costs distributed over laying period)
  const healthCostPerEgg = calculateHealthCostPerEgg(date);

  const totalCostPerEgg = feedCostPerEgg + fixedCostPerEgg + healthCostPerEgg;

  return {
    feedCostPerEgg,
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

---
