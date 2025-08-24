import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  date,
  decimal,
  text,
  boolean,
  jsonb,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  full_name: varchar("full_name", { length: 100 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Houses/Coops table
export const houses = pgTable("houses", {
  id: serial("id").primaryKey(),
  house_name: varchar("house_name", { length: 50 }).notNull(),
  capacity: integer("capacity").notNull(),
  current_bird_count: integer("current_bird_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// Daily production logs
export const daily_logs = pgTable(
  "daily_logs",
  {
    id: serial("id").primaryKey(),
    log_date: date("log_date").notNull(),
    house_id: integer("house_id"),
    eggs_total: integer("eggs_total").notNull().default(0),
    eggs_grade_a: integer("eggs_grade_a").notNull().default(0),
    eggs_grade_b: integer("eggs_grade_b").notNull().default(0),
    eggs_grade_c: integer("eggs_grade_c").notNull().default(0),
    feed_given_kg: decimal("feed_given_kg", { precision: 8, scale: 2 })
      .notNull()
      .default(sql`0`),
    mortality_count: integer("mortality_count").notNull().default(0),
    notes: text("notes"),
    supervisor_id: integer("supervisor_id"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    unique("unq_log_date_house").on(t.log_date, t.house_id),
    check(
      "chk_eggs_valid",
      sql`${t.eggs_total} = ${t.eggs_grade_a} + ${t.eggs_grade_b} + ${t.eggs_grade_c}`
    ),
  ]
);

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customer_name: varchar("customer_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  preferred_contact: varchar("preferred_contact", { length: 20 }).default(
    "phone"
  ),
  created_at: timestamp("created_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Sales
export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    sale_date: date("sale_date").notNull(),
    customer_id: integer("customer_id"),
    grade_a_qty: integer("grade_a_qty").default(0),
    grade_a_price: decimal("grade_a_price", { precision: 8, scale: 2 }).default(
      sql`0`
    ),
    grade_b_qty: integer("grade_b_qty").default(0),
    grade_b_price: decimal("grade_b_price", { precision: 8, scale: 2 }).default(
      sql`0`
    ),
    grade_c_qty: integer("grade_c_qty").default(0),
    grade_c_price: decimal("grade_c_price", { precision: 8, scale: 2 }).default(
      sql`0`
    ),
    total_amount: decimal("total_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    payment_method: varchar("payment_method", { length: 20 }).notNull(),
    payment_status: varchar("payment_status", { length: 20 })
      .notNull()
      .default("pending"),
    supervisor_id: integer("supervisor_id"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_sales_date").on(t.sale_date),
    index("idx_sales_customer").on(t.customer_id),
  ]
);

// Feed recipes
export const feed_recipes = pgTable("feed_recipes", {
  id: serial("id").primaryKey(),
  recipe_name: varchar("recipe_name", { length: 100 }).notNull(),
  other_ingredients: jsonb("other_ingredients"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Ingredients (catalog of possible ingredients for recipes)
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  unit: varchar("unit", { length: 20 }).default("kg"),
  price_per_unit: decimal("price_per_unit", { precision: 10, scale: 4 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Join table: recipe -> ingredient with percentage composition
export const recipe_ingredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipe_id: integer("recipe_id").notNull(),
  ingredient_id: integer("ingredient_id").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Feed batches
export const feed_batches = pgTable("feed_batches", {
  id: serial("id").primaryKey(),
  batch_date: date("batch_date").notNull(),
  batch_size_kg: decimal("batch_size_kg", { precision: 8, scale: 2 }).notNull(),
  recipe_id: integer("recipe_id"),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  cost_per_kg: decimal("cost_per_kg", { precision: 8, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Batch ingredients (normalized)
export const batch_ingredients = pgTable("batch_ingredients", {
  id: serial("id").primaryKey(),
  batch_id: integer("batch_id"),
  ingredient_id: integer("ingredient_id"),
  ingredient_name: varchar("ingredient_name", { length: 50 }).notNull(),
  amount_kg: decimal("amount_kg", { precision: 8, scale: 2 }).notNull(),
  cost_per_kg: decimal("cost_per_kg", { precision: 8, scale: 2 }).notNull(),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
});

// Operating costs
export const operating_costs = pgTable(
  "operating_costs",
  {
    id: serial("id").primaryKey(),
    month_year: date("month_year").notNull(),
    supervisor_salary: decimal("supervisor_salary", {
      precision: 10,
      scale: 2,
    }).default(sql`0`),
    total_laborer_salaries: decimal("total_laborer_salaries", {
      precision: 10,
      scale: 2,
    }).default(sql`0`),
    electricity_cost: decimal("electricity_cost", {
      precision: 10,
      scale: 2,
    }).default(sql`0`),
    water_cost: decimal("water_cost", { precision: 10, scale: 2 }).default(
      sql`0`
    ),
    maintenance_cost: decimal("maintenance_cost", {
      precision: 10,
      scale: 2,
    }).default(sql`0`),
    other_costs: decimal("other_costs", { precision: 10, scale: 2 }).default(
      sql`0`
    ),
    total_monthly_cost: decimal("total_monthly_cost", {
      precision: 10,
      scale: 2,
    }).notNull(),
  },
  (t) => [unique("unq_month_year").on(t.month_year)]
);

// Bird costs
export const bird_costs = pgTable("bird_costs", {
  id: serial("id").primaryKey(),
  batch_date: date("batch_date").notNull(),
  birds_purchased: integer("birds_purchased").notNull(),
  cost_per_bird: decimal("cost_per_bird", { precision: 8, scale: 2 }).notNull(),
  vaccination_cost_per_bird: decimal("vaccination_cost_per_bird", {
    precision: 8,
    scale: 2,
  }).default(sql`0`),
  expected_laying_months: integer("expected_laying_months").default(12),
});

// Daily costs
export const daily_costs = pgTable(
  "daily_costs",
  {
    id: serial("id").primaryKey(),
    cost_date: date("cost_date").notNull(),
    total_feed_cost: decimal("total_feed_cost", {
      precision: 10,
      scale: 2,
    }).notNull(),
    total_eggs_produced: integer("total_eggs_produced").notNull(),
    feed_cost_per_egg: decimal("feed_cost_per_egg", {
      precision: 8,
      scale: 4,
    }).notNull(),
    fixed_cost_per_egg: decimal("fixed_cost_per_egg", {
      precision: 8,
      scale: 4,
    }).notNull(),
    health_cost_per_egg: decimal("health_cost_per_egg", {
      precision: 8,
      scale: 4,
    }).default(sql`0`),
    total_cost_per_egg: decimal("total_cost_per_egg", {
      precision: 8,
      scale: 4,
    }).notNull(),
    suggested_price_grade_a: decimal("suggested_price_grade_a", {
      precision: 8,
      scale: 2,
    }),
    suggested_price_grade_b: decimal("suggested_price_grade_b", {
      precision: 8,
      scale: 2,
    }),
    suggested_price_grade_c: decimal("suggested_price_grade_c", {
      precision: 8,
      scale: 2,
    }),
    calculated_at: timestamp("calculated_at").defaultNow(),
  },
  (t) => [index("idx_daily_costs_date").on(t.cost_date)]
);

// Daily Activities (Task Management System) 
export const dailyActivities = pgTable(
  "daily_activities",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: integer("user_id").references(() => users.id),
    laborer_id: integer("laborer_id").references(() => laborers.id), // NEW: Link tasks to laborers
    activityType: varchar("activity_type", { length: 50 }).notNull(),
    farmSection: varchar("farm_section", { length: 100 }),
    location: varchar("location", { length: 200 }),
    data: jsonb("data"), // Activity-specific data
    notes: text("notes"),
    status: varchar("status", { length: 20 }).default("pending"),
    priority: varchar("priority", { length: 10 }).default("normal"),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    timestamp: timestamp("timestamp").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_daily_activities_user").on(t.userId),
    index("idx_daily_activities_laborer").on(t.laborer_id), // NEW: Index for laborer queries
    index("idx_daily_activities_type").on(t.activityType),
    index("idx_daily_activities_status").on(t.status),
    index("idx_daily_activities_date").on(t.timestamp),
    check("chk_activity_status", sql`status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')`),
    check("chk_activity_priority", sql`priority IN ('low', 'normal', 'high', 'critical')`),
  ]
);

// Alerts system
export const alerts = pgTable(
  "alerts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 50 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    activity_id: varchar("activity_id").references(() => dailyActivities.id),
    user_id: integer("user_id").references(() => users.id),
    farm_section: varchar("farm_section", { length: 100 }),
    is_read: boolean("is_read").default(false),
    created_at: timestamp("created_at").defaultNow(),
    expires_at: timestamp("expires_at"),
  },
  (t) => [
    index("idx_alerts_user_id").on(t.user_id),
    index("idx_alerts_severity").on(t.severity),
    index("idx_alerts_is_read").on(t.is_read),
    index("idx_alerts_created_at").on(t.created_at),
  ]
);

// Laborers management
export const laborers = pgTable(
  "laborers",
  {
    id: serial("id").primaryKey(),
    employee_id: varchar("employee_id", { length: 20 }).unique(),
    full_name: varchar("full_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    position: varchar("position", { length: 50 }).notNull(),
    monthly_salary: decimal("monthly_salary", {
      precision: 10,
      scale: 2,
    }).notNull(),
    hire_date: date("hire_date").notNull(),
    is_active: boolean("is_active").default(true),
    emergency_contact: varchar("emergency_contact", { length: 100 }),
    emergency_phone: varchar("emergency_phone", { length: 20 }),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_laborers_active").on(t.is_active),
    index("idx_laborers_position").on(t.position),
  ]
);

// Daily work assignments
export const daily_work_assignments = pgTable(
  "daily_work_assignments",
  {
    id: serial("id").primaryKey(),
    work_date: date("work_date").notNull(),
    laborer_id: integer("laborer_id").references(() => laborers.id),
    tasks_assigned: text("tasks_assigned").array(),
    attendance_status: varchar("attendance_status", { length: 20 }).default(
      "present"
    ),
    performance_notes: text("performance_notes"),
    supervisor_id: integer("supervisor_id").references(() => users.id),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    unique("unq_work_date_laborer").on(t.work_date, t.laborer_id),
    index("idx_daily_work_assignments_date").on(t.work_date),
    index("idx_daily_work_assignments_laborer").on(t.laborer_id),
    check(
      "chk_attendance_status",
      sql`attendance_status IN ('present', 'absent', 'half_day', 'late')`
    ),
  ]
);

// Monthly payroll records
export const monthly_payroll = pgTable(
  "monthly_payroll",
  {
    id: serial("id").primaryKey(),
    month_year: date("month_year").notNull(),
    laborer_id: integer("laborer_id").references(() => laborers.id),
    base_salary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
    days_worked: integer("days_worked").notNull().default(0),
    days_absent: integer("days_absent").notNull().default(0),
    salary_deductions: decimal("salary_deductions", {
      precision: 8,
      scale: 2,
    }).default("0"),
    bonus_amount: decimal("bonus_amount", { precision: 8, scale: 2 }).default(
      "0"
    ),
    final_salary: decimal("final_salary", {
      precision: 10,
      scale: 2,
    }).notNull(),
    payment_date: date("payment_date"),
    payment_status: varchar("payment_status", { length: 20 }).default(
      "pending"
    ),
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    unique("unq_month_year_laborer").on(t.month_year, t.laborer_id),
    index("idx_monthly_payroll_date").on(t.month_year),
    index("idx_monthly_payroll_laborer").on(t.laborer_id),
    check("chk_payment_status", sql`payment_status IN ('pending', 'paid')`),
  ]
);
