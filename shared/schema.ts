import { sql, relations } from "drizzle-orm";
import {
    index,
    jsonb,
    pgTable,
    timestamp,
    varchar,
    text,
    integer,
    decimal,
    boolean,
    date,
    pgEnum,
    unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
    "sessions",
    {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull(),
    },
    (table) => [index("IDX_session_expire").on(table.expire)]
);

// User roles enum - Keeping existing roles for backward compatibility
// In the closed system: "ceo" = farm owner, "supervisor" = daily operations
export const userRoleEnum = pgEnum("user_role", [
    "admin", // System / full access
    "staff", // General staff (previously supervisor/general_manager/ceo consolidated)
]);

// Granular Permissions
export const permissions = pgTable("permissions", {
    code: varchar("code", { length: 100 }).primaryKey(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const userPermissions = pgTable(
    "user_permissions",
    {
        userId: varchar("user_id")
            .notNull()
            .references(() => users.id),
        permissionCode: varchar("permission_code")
            .notNull()
            .references(() => permissions.code),
        createdAt: timestamp("created_at").defaultNow(),
    },
    (table) => [unique("unq_user_perm").on(table.userId, table.permissionCode)]
);

// User storage table with local authentication support
export const users = pgTable("users", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    email: varchar("email").unique().notNull(),
    password: varchar("password").notNull(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    role: userRoleEnum("role").default("staff"),
    emailVerified: boolean("email_verified").default(false),
    lastLoginAt: timestamp("last_login_at"),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Refresh tokens table for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    isRevoked: boolean("is_revoked").default(false),
});

// Daily Activities
export const dailyActivities = pgTable("daily_activities", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.id),
    activityType: varchar("activity_type").notNull(), // 'egg_collection', 'feed_distribution', 'mortality', 'medication', 'water_consumption', 'egg_sales'
    timestamp: timestamp("timestamp").defaultNow(),
    location: varchar("location"),
    farmSection: varchar("farm_section"), // New: farm section/coop location
    weatherConditions: varchar("weather_conditions"),
    weatherTemperature: decimal("weather_temperature", {
        precision: 5,
        scale: 2,
    }), // New: temperature
    weatherHumidity: decimal("weather_humidity", { precision: 5, scale: 2 }), // New: humidity
    status: varchar("status").default("pending"), // New: pending, in_progress, completed, overdue
    priority: varchar("priority").default("normal"), // New: low, normal, high, critical
    dueDate: timestamp("due_date"), // New: when task should be completed
    completedAt: timestamp("completed_at"), // New: when task was actually completed
    reviewerId: varchar("reviewer_id").references(() => users.id), // New: who reviewed/approved
    reviewNotes: text("review_notes"), // New: reviewer feedback
    data: jsonb("data").notNull(), // Flexible JSON data for different activity types
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Alert Thresholds - Define farm operation alert limits
export const alertThresholds = pgTable("alert_thresholds", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    thresholdType: varchar("threshold_type").notNull(), // 'daily_mortality_count', 'egg_production_drop', etc.
    thresholdValue: decimal("threshold_value", {
        precision: 10,
        scale: 2,
    }).notNull(),
    comparisonType: varchar("comparison_type").notNull(), // 'greater_than', 'less_than', 'equals'
    alertLevel: varchar("alert_level").notNull(), // 'low', 'medium', 'high', 'critical'
    notificationChannels: jsonb("notification_channels"), // ['email', 'sms', 'dashboard']
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts - Active farm operation alerts
export const alerts = pgTable("alerts", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    type: varchar("type").notNull(), // 'threshold_exceeded', 'deadline_missed', 'quality_concern'
    severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    activityId: varchar("activity_id").references(() => dailyActivities.id),
    userId: varchar("user_id").references(() => users.id),
    farmSection: varchar("farm_section"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
});

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    category: varchar("category").notNull(), // 'feed', 'medicine', 'equipment', 'supplies'
    currentStock: decimal("current_stock", {
        precision: 10,
        scale: 2,
    }).notNull(),
    unit: varchar("unit").notNull(), // 'kg', 'tons', 'bottles', 'units'
    reorderPoint: decimal("reorder_point", {
        precision: 10,
        scale: 2,
    }).notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
    supplierId: varchar("supplier_id"),
    expirationDate: date("expiration_date"),
    storageLocation: varchar("storage_location"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Adjustments - Track changes in inventory stock
export const inventoryAdjustments = pgTable("inventory_adjustments", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    itemId: varchar("item_id")
        .notNull()
        .references(() => inventoryItems.id),
    adjustmentType: varchar("adjustment_type").notNull(), // 'restock' | 'consume'
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    contactPerson: varchar("contact_person"),
    email: varchar("email"),
    phone: varchar("phone"),
    address: text("address"),
    paymentTerms: varchar("payment_terms"),
    deliveryPerformance: decimal("delivery_performance", {
        precision: 3,
        scale: 2,
    }),
    qualityRating: decimal("quality_rating", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow(),
});

// Employees
export const employees = pgTable("employees", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    employeeId: varchar("employee_id").unique().notNull(),
    firstName: varchar("first_name").notNull(),
    lastName: varchar("last_name").notNull(),
    email: varchar("email"),
    phone: varchar("phone"),
    address: text("address"),
    role: varchar("role").notNull(),
    department: varchar("department").notNull(),
    startDate: date("start_date").notNull(),
    employmentType: varchar("employment_type").notNull(), // 'full_time', 'part_time', 'contract'
    baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
    payGrade: varchar("pay_grade"),
    status: varchar("status").default("active"), // 'active', 'inactive', 'on_leave'
    emergencyContact: jsonb("emergency_contact"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Transactions
export const financialTransactions = pgTable("financial_transactions", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    type: varchar("type").notNull(), // 'expense', 'revenue', 'salary', 'procurement'
    category: varchar("category").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    referenceId: varchar("reference_id"), // Links to other entities like employee, supplier
    supplierId: varchar("supplier_id"),
    employeeId: varchar("employee_id"),
    transactionDate: date("transaction_date").notNull(),
    paymentMethod: varchar("payment_method"),
    status: varchar("status").default("completed"),
    createdBy: varchar("created_by")
        .notNull()
        .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// Health Records
export const healthRecords = pgTable("health_records", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    recordType: varchar("record_type").notNull(), // 'medication', 'vaccination', 'treatment', 'observation'
    flockSection: varchar("flock_section"),
    medicationType: varchar("medication_type"),
    dosage: varchar("dosage"),
    administrationMethod: varchar("administration_method"),
    withdrawalPeriod: integer("withdrawal_period"), // in days
    symptoms: text("symptoms"),
    diagnosis: text("diagnosis"),
    treatment: text("treatment"),
    veterinarianId: varchar("veterinarian_id"),
    recordedBy: varchar("recorded_by")
        .notNull()
        .references(() => users.id),
    recordDate: date("record_date").notNull(),
    followUpDate: date("follow_up_date"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Production Data
export const productionData = pgTable("production_data", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    date: date("date").notNull(),
    flockSection: varchar("flock_section"),
    eggProduction: integer("egg_production").default(0),
    feedConsumption: decimal("feed_consumption", {
        precision: 8,
        scale: 2,
    }).default("0"),
    waterConsumption: decimal("water_consumption", {
        precision: 8,
        scale: 2,
    }).default("0"),
    mortality: integer("mortality").default(0),
    temperature: decimal("temperature", { precision: 4, scale: 1 }),
    humidity: decimal("humidity", { precision: 4, scale: 1 }),
    createdAt: timestamp("created_at").defaultNow(),
});

// Analytics and KPI enums
export const kpiCategoryEnum = pgEnum("kpi_category", [
    "production",
    "financial",
    "operational",
    "quality",
    "efficiency",
]);

export const reportFrequencyEnum = pgEnum("report_frequency", [
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
]);

export const kpiTrendEnum = pgEnum("kpi_trend", ["up", "down", "stable"]);

// Daily KPI Summary table for dashboard analytics
export const dailyKpiSummary = pgTable(
    "daily_kpi_summary",
    {
        id: varchar("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        date: date("date").notNull(),
        farmSection: varchar("farm_section"),

        // Production KPIs
        totalEggProduction: integer("total_egg_production").default(0),
        eggProductionRate: decimal("egg_production_rate", {
            precision: 5,
            scale: 2,
        }).default("0"),
        feedConversionRatio: decimal("feed_conversion_ratio", {
            precision: 5,
            scale: 3,
        }).default("0"),
        averageEggWeight: decimal("average_egg_weight", {
            precision: 4,
            scale: 1,
        }).default("0"),
        qualityGradeAPercent: decimal("quality_grade_a_percent", {
            precision: 5,
            scale: 2,
        }).default("0"),

        // Financial KPIs
        dailyRevenue: decimal("daily_revenue", {
            precision: 10,
            scale: 2,
        }).default("0"),
        dailyExpenses: decimal("daily_expenses", {
            precision: 10,
            scale: 2,
        }).default("0"),
        profitMargin: decimal("profit_margin", {
            precision: 5,
            scale: 2,
        }).default("0"),
        feedCostPerEgg: decimal("feed_cost_per_egg", {
            precision: 6,
            scale: 4,
        }).default("0"),

        // Operational KPIs
        mortalityRate: decimal("mortality_rate", {
            precision: 5,
            scale: 2,
        }).default("0"),
        mortalityCount: integer("mortality_count").default(0),
        activeAlertsCount: integer("active_alerts_count").default(0),
        criticalAlertsCount: integer("critical_alerts_count").default(0),

        // Efficiency KPIs
        eggCollectionEfficiency: decimal("egg_collection_efficiency", {
            precision: 5,
            scale: 2,
        }).default("0"),
        feedUtilizationRate: decimal("feed_utilization_rate", {
            precision: 5,
            scale: 2,
        }).default("0"),
        laborProductivity: decimal("labor_productivity", {
            precision: 8,
            scale: 2,
        }).default("0"),

        // Metadata
        calculatedAt: timestamp("calculated_at").defaultNow(),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    },
    (table) => [
        index("idx_daily_kpi_date").on(table.date),
        index("idx_daily_kpi_farm_section").on(table.farmSection),
        index("idx_daily_kpi_calculated_at").on(table.calculatedAt),
        // Unique constraint for upsert operations
        unique("unq_daily_kpi_date_section").on(table.date, table.farmSection),
    ]
);

// KPI Trends table for tracking performance over time
export const kpiTrends = pgTable(
    "kpi_trends",
    {
        id: varchar("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        kpiCategory: kpiCategoryEnum("kpi_category").notNull(),
        kpiName: varchar("kpi_name").notNull(),
        currentValue: decimal("current_value", {
            precision: 12,
            scale: 4,
        }).notNull(),
        previousValue: decimal("previous_value", { precision: 12, scale: 4 }),
        percentageChange: decimal("percentage_change", {
            precision: 6,
            scale: 2,
        }),
        trend: kpiTrendEnum("trend"),
        periodStart: timestamp("period_start").notNull(),
        periodEnd: timestamp("period_end").notNull(),
        farmSection: varchar("farm_section"),
        createdAt: timestamp("created_at").defaultNow(),
    },
    (table) => [
        index("idx_kpi_trends_category").on(table.kpiCategory),
        index("idx_kpi_trends_name").on(table.kpiName),
        index("idx_kpi_trends_period").on(table.periodStart, table.periodEnd),
    ]
);

// Report Templates table for scheduled reports
export const reportTemplates = pgTable(
    "report_templates",
    {
        id: varchar("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        name: varchar("name").notNull(),
        description: text("description"),
        templateType: varchar("template_type").notNull(), // 'executive', 'operational', 'financial'
        frequency: reportFrequencyEnum("frequency").notNull(),
        isActive: boolean("is_active").default(true),

        // Report configuration
        includedKpis: jsonb("included_kpis").notNull(), // Array of KPI categories/names to include
        filterCriteria: jsonb("filter_criteria"), // Date ranges, farm sections, etc.
        formatOptions: jsonb("format_options"), // PDF/CSV settings, styling options

        // Delivery settings
        recipientEmails: jsonb("recipient_emails"), // Array of email addresses
        nextRunDate: timestamp("next_run_date"),
        lastRunDate: timestamp("last_run_date"),

        createdBy: varchar("created_by").references(() => users.id),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    },
    (table) => [
        index("idx_report_templates_frequency").on(table.frequency),
        index("idx_report_templates_next_run").on(table.nextRunDate),
        index("idx_report_templates_active").on(table.isActive),
    ]
);

// Report Runs table for tracking report generation history
export const reportRuns = pgTable(
    "report_runs",
    {
        id: varchar("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        templateId: varchar("template_id")
            .references(() => reportTemplates.id)
            .notNull(),
        status: varchar("status").notNull(), // 'pending', 'running', 'completed', 'failed'
        startedAt: timestamp("started_at").notNull(),
        completedAt: timestamp("completed_at"),
        errorMessage: text("error_message"),

        // Report output
        filePath: varchar("file_path"), // Path to generated report file
        fileSize: integer("file_size"), // File size in bytes
        recordCount: integer("record_count"), // Number of records in report

        // Delivery tracking
        emailsSent: integer("emails_sent").default(0),
        emailsFailed: integer("emails_failed").default(0),
        deliveryAttempts: integer("delivery_attempts").default(0),

        createdAt: timestamp("created_at").defaultNow(),
    },
    (table) => [
        index("idx_report_runs_template").on(table.templateId),
        index("idx_report_runs_status").on(table.status),
        index("idx_report_runs_started").on(table.startedAt),
    ]
);

// Dashboard Configurations table for user-specific dashboard layouts
export const dashboardConfigurations = pgTable(
    "dashboard_configurations",
    {
        id: varchar("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: varchar("user_id")
            .references(() => users.id)
            .notNull(),
        dashboardName: varchar("dashboard_name").notNull(),
        isDefault: boolean("is_default").default(false),

        // Layout configuration
        layout: jsonb("layout").notNull(), // Grid layout configuration
        widgets: jsonb("widgets").notNull(), // Widget configurations and positions
        filters: jsonb("filters"), // Default filters for the dashboard
        refreshInterval: integer("refresh_interval").default(30), // Seconds

        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    },
    (table) => [
        index("idx_dashboard_user").on(table.userId),
        index("idx_dashboard_default").on(table.isDefault),
    ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    dailyActivities: many(dailyActivities),
    financialTransactions: many(financialTransactions),
    healthRecords: many(healthRecords),
}));

export const dailyActivitiesRelations = relations(
    dailyActivities,
    ({ one }) => ({
        user: one(users, {
            fields: [dailyActivities.userId],
            references: [users.id],
        }),
    })
);

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
    supplier: one(suppliers, {
        fields: [inventoryItems.supplierId],
        references: [suppliers.id],
    }),
}));

export const financialTransactionsRelations = relations(
    financialTransactions,
    ({ one }) => ({
        createdBy: one(users, {
            fields: [financialTransactions.createdBy],
            references: [users.id],
        }),
        supplier: one(suppliers, {
            fields: [financialTransactions.supplierId],
            references: [suppliers.id],
        }),
        employee: one(employees, {
            fields: [financialTransactions.employeeId],
            references: [employees.id],
        }),
    })
);

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
    recordedBy: one(users, {
        fields: [healthRecords.recordedBy],
        references: [users.id],
    }),
}));

// Analytics relations
export const reportTemplatesRelations = relations(
    reportTemplates,
    ({ one, many }) => ({
        createdBy: one(users, {
            fields: [reportTemplates.createdBy],
            references: [users.id],
        }),
        reportRuns: many(reportRuns),
    })
);

export const reportRunsRelations = relations(reportRuns, ({ one }) => ({
    template: one(reportTemplates, {
        fields: [reportRuns.templateId],
        references: [reportTemplates.id],
    }),
}));

export const dashboardConfigurationsRelations = relations(
    dashboardConfigurations,
    ({ one }) => ({
        user: one(users, {
            fields: [dashboardConfigurations.userId],
            references: [users.id],
        }),
    })
);

// Permission relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
    userPermissions: many(userPermissions),
}));
export const userPermissionsRelations = relations(
    userPermissions,
    ({ one }) => ({
        user: one(users, {
            fields: [userPermissions.userId],
            references: [users.id],
        }),
        permission: one(permissions, {
            fields: [userPermissions.permissionCode],
            references: [permissions.code],
        }),
    })
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertDailyActivitySchema = createInsertSchema(
    dailyActivities
).omit({
    id: true,
    createdAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(
    inventoryItems
).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
    id: true,
    createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees)
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        baseSalary: z
            .union([
                z.string().transform((val) => val),
                z.number().transform((val) => val.toString()),
            ])
            .pipe(z.string()),
    });

export const insertFinancialTransactionSchema = createInsertSchema(
    financialTransactions
).omit({
    id: true,
    createdAt: true,
});

export const insertHealthRecordSchema = createInsertSchema(healthRecords).omit({
    id: true,
    createdAt: true,
});

export const insertProductionDataSchema = createInsertSchema(
    productionData
).omit({
    id: true,
    createdAt: true,
});

export const insertAlertThresholdSchema = createInsertSchema(
    alertThresholds
).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
    id: true,
    createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
    createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;
export type InsertDailyActivity = z.infer<typeof insertDailyActivitySchema>;
export type DailyActivity = typeof dailyActivities.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertFinancialTransaction = z.infer<
    typeof insertFinancialTransactionSchema
>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;
export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertProductionData = z.infer<typeof insertProductionDataSchema>;
export type ProductionData = typeof productionData.$inferSelect;
export type InsertAlertThreshold = z.infer<typeof insertAlertThresholdSchema>;
export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Analytics schema exports
export const insertDailyKpiSummarySchema = createInsertSchema(
    dailyKpiSummary
).omit({
    id: true,
    calculatedAt: true,
    createdAt: true,
    updatedAt: true,
});

export const insertKpiTrendSchema = createInsertSchema(kpiTrends).omit({
    id: true,
    createdAt: true,
});

export const insertReportTemplateSchema = createInsertSchema(
    reportTemplates
).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const insertReportRunSchema = createInsertSchema(reportRuns).omit({
    id: true,
    createdAt: true,
});

export const insertDashboardConfigurationSchema = createInsertSchema(
    dashboardConfigurations
).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

// Analytics types
export type InsertDailyKpiSummary = z.infer<typeof insertDailyKpiSummarySchema>;
export type DailyKpiSummary = typeof dailyKpiSummary.$inferSelect;
export type InsertKpiTrend = z.infer<typeof insertKpiTrendSchema>;
export type KpiTrend = typeof kpiTrends.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportRun = z.infer<typeof insertReportRunSchema>;
export type ReportRun = typeof reportRuns.$inferSelect;
export type InsertDashboardConfiguration = z.infer<
    typeof insertDashboardConfigurationSchema
>;
export type DashboardConfiguration =
    typeof dashboardConfigurations.$inferSelect;
