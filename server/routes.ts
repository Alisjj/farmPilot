import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { kpiEngine } from "./kpiEngine";
import { db } from "./db";
import {
    insertDailyActivitySchema,
    insertInventoryItemSchema,
    insertSupplierSchema,
    insertEmployeeSchema,
    insertFinancialTransactionSchema,
    insertHealthRecordSchema,
    insertProductionDataSchema,
    dailyActivities,
    financialTransactions,
} from "@shared/schema";
import { z } from "zod";
import { authorize } from "./middleware/authorize";
import { dispatchAlert } from "./notifications/dispatcher";
import { listAvailableReports, generateReport } from "./reports";

export async function registerRoutes(app: Express): Promise<Server> {
    // Auth middleware
    await setupAuth(app);

    // Auth routes
    app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.id;
            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Return user without sensitive information
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });

    // GET logout route for sidebar navigation
    app.get("/api/logout", async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (refreshToken) {
                // Revoke the refresh token using storage method if available
                try {
                    await storage.revokeRefreshToken?.(refreshToken);
                } catch (error) {
                    console.warn("Could not revoke refresh token:", error);
                }
            }

            // Clear cookies
            res.clearCookie("accessToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            // Redirect to home page after logout
            res.redirect("/");
        } catch (error) {
            console.error("Logout error:", error);
            res.status(500).json({ message: "Logout failed" });
        }
    });

    // Dashboard Analytics
    app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
        try {
            const metrics = await storage.getDashboardMetrics();
            res.json(metrics);
        } catch (error) {
            console.error("Error fetching dashboard metrics:", error);
            res.status(500).json({
                message: "Failed to fetch dashboard metrics",
            });
        }
    });

    // Executive KPI Summary (Phase 2 early endpoint)
    app.get("/api/kpi/summary", isAuthenticated, async (req, res) => {
        try {
            const summary = await kpiEngine.getExecutiveSummary();
            res.json(summary);
        } catch (error) {
            console.error("Error fetching KPI summary:", error);
            res.status(500).json({ message: "Failed to fetch KPI summary" });
        }
    });

    // Daily Activities Routes
    app.get("/api/activities", isAuthenticated, async (req, res) => {
        try {
            const { type, limit, userId } = req.query;
            let activities;

            if (type) {
                activities = await storage.getDailyActivitiesByType(
                    type as string,
                    limit ? parseInt(limit as string) : undefined
                );
            } else {
                activities = await storage.getDailyActivities(
                    userId as string, // This will filter by userId if provided
                    limit ? parseInt(limit as string) : undefined
                );
            }

            res.json(activities);
        } catch (error) {
            console.error("Error fetching activities:", error);
            res.status(500).json({ message: "Failed to fetch activities" });
        }
    });

    app.post("/api/activities", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.id; // fixed: was req.user.claims.sub
            const activityData = insertDailyActivitySchema.parse({
                ...req.body,
                userId,
            });

            const activity = await storage.createDailyActivity(activityData);
            res.status(201).json(activity);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid activity data",
                    errors: error.errors,
                });
            } else {
                console.error("Error creating activity:", error);
                res.status(500).json({ message: "Failed to create activity" });
            }
        }
    });

    app.put("/api/activities/:id", isAuthenticated, async (req: any, res) => {
        try {
            const activityId = req.params.id;
            const userId = req.user.id; // fixed
            const updateData = req.body;

            // For now, we'll just allow status updates
            // In a more complex system, you'd want more validation
            const updatedActivity = await storage.updateDailyActivity(
                activityId,
                updateData,
                userId
            );

            if (!updatedActivity) {
                return res
                    .status(404)
                    .json({ message: "Activity not found or unauthorized" });
            }

            res.json(updatedActivity);
        } catch (error) {
            console.error("Error updating activity:", error);
            res.status(500).json({ message: "Failed to update activity" });
        }
    });

    app.get("/api/activities/date/:date", isAuthenticated, async (req, res) => {
        try {
            const { date } = req.params;
            const activities = await storage.getDailyActivitiesByDate(date);
            res.json(activities);
        } catch (error) {
            console.error("Error fetching activities by date:", error);
            res.status(500).json({ message: "Failed to fetch activities" });
        }
    });

    // Enhanced Activities Routes (Phase 1)
    app.get(
        "/api/activities/metrics",
        isAuthenticated,
        async (req: any, res) => {
            try {
                const {
                    dateFrom,
                    dateTo,
                    activityType,
                    farmSection,
                    status,
                    userId,
                } = req.query;

                const filters = {
                    dateFrom: dateFrom
                        ? new Date(dateFrom as string)
                        : undefined,
                    dateTo: dateTo ? new Date(dateTo as string) : undefined,
                    activityType: activityType as string,
                    farmSection: farmSection as string,
                    status: status as string,
                    userId: userId as string,
                };

                const activities = await storage.getActivitiesWithMetrics(
                    filters
                );
                res.json(activities);
            } catch (error) {
                console.error("Error fetching activity metrics:", error);
                res.status(500).json({
                    message: "Failed to fetch activity metrics",
                });
            }
        }
    );

    app.get("/api/activities/summary", isAuthenticated, async (req, res) => {
        try {
            const { dateFrom, dateTo } = req.query;

            const fromDate = dateFrom
                ? new Date(dateFrom as string)
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const toDate = dateTo ? new Date(dateTo as string) : new Date();

            const summary = await storage.getActivitySummary(fromDate, toDate);
            res.json(summary);
        } catch (error) {
            console.error("Error fetching activity summary:", error);
            res.status(500).json({
                message: "Failed to fetch activity summary",
            });
        }
    });

    app.post(
        "/api/activities/validate",
        isAuthenticated,
        async (req: any, res) => {
            try {
                const userId = req.user.id; // fixed
                const activityData = {
                    ...req.body,
                    userId,
                };

                // Enhanced validation with threshold checking
                const activity =
                    await storage.createDailyActivityWithValidation(
                        activityData
                    );
                res.status(201).json(activity);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    res.status(400).json({
                        message: "Invalid activity data",
                        errors: error.errors,
                    });
                } else {
                    console.error("Error creating validated activity:", error);
                    res.status(500).json({
                        message: "Failed to create activity",
                    });
                }
            }
        }
    );

    // Alert System Routes
    app.get("/api/alerts", isAuthenticated, async (req: any, res) => {
        try {
            const userId =
                process.env.TEST_BYPASS_AUTH === "true"
                    ? undefined
                    : req.user.id;
            const { isRead } = req.query;
            const readStatus =
                isRead === "true"
                    ? true
                    : isRead === "false"
                    ? false
                    : undefined;
            const alerts = await storage.getAlerts(userId, readStatus);

            res.json(alerts);
        } catch (error) {
            console.error("Error fetching alerts:", error);
            res.status(500).json({ message: "Failed to fetch alerts" });
        }
    });

    app.post(
        "/api/alerts/:id/mark-read",
        isAuthenticated,
        async (req: any, res) => {
            try {
                const alertId = req.params.id;
                const userId = req.user.id; // fixed

                await storage.markAlertAsRead(alertId, userId);
                res.json({ success: true });
            } catch (error) {
                console.error("Error marking alert as read:", error);
                res.status(500).json({
                    message: "Failed to mark alert as read",
                });
            }
        }
    );

    app.get(
        "/api/thresholds",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const thresholds = await storage.getAlertThresholds();
                res.json(thresholds);
            } catch (error) {
                console.error("Error fetching alert thresholds:", error);
                res.status(500).json({
                    message: "Failed to fetch alert thresholds",
                });
            }
        }
    );

    app.put(
        "/api/thresholds/:id",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const thresholdId = req.params.id;
                const updates = req.body;

                const updatedThreshold = await storage.updateAlertThreshold(
                    thresholdId,
                    updates
                );
                res.json(updatedThreshold);
            } catch (error) {
                console.error("Error updating alert threshold:", error);
                res.status(500).json({
                    message: "Failed to update alert threshold",
                });
            }
        }
    );

    app.post(
        "/api/thresholds",
        isAuthenticated,
        authorize(["admin"]),
        async (req: any, res) => {
            try {
                const payload = req.body;
                const threshold = await storage.createAlertThreshold({
                    thresholdType: payload.thresholdType,
                    thresholdValue: payload.thresholdValue,
                    comparisonType:
                        payload.comparisonType || "less_than_or_equal",
                    alertLevel: payload.alertLevel || "warning",
                    notificationChannels: payload.notificationChannels || [
                        "dashboard",
                    ],
                    isActive: payload.isActive !== false,
                });
                res.status(201).json(threshold);
            } catch (error) {
                console.error("Error creating alert threshold:", error);
                res.status(500).json({
                    message: "Failed to create alert threshold",
                });
            }
        }
    );

    // Inventory Routes
    // In-memory cache for recent generated alerts to prevent duplication (reset on restart)
    const recentGeneratedAlerts = new Map<string, number>(); // key -> timestamp
    const ALERT_DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

    app.get("/api/inventory", isAuthenticated, async (req, res, next) => {
        try {
            const now = Date.now();
            // Purge old cache entries
            const entryArr = Array.from(recentGeneratedAlerts.entries());
            for (let i = 0; i < entryArr.length; i++) {
                const [k, ts] = entryArr[i];
                if (now - ts > ALERT_DEDUP_WINDOW_MS)
                    recentGeneratedAlerts.delete(k);
            }
            const items = await storage.getInventoryItems();
            const thresholds = await storage.getAlertThresholds();
            const lowStockThresholds = thresholds.filter((t) =>
                t.thresholdType.startsWith("inventory_low_stock")
            );

            const alertsToCreate: any[] = [];
            for (const t of lowStockThresholds) {
                for (const item of items) {
                    const current = parseFloat(item.currentStock as any);
                    const reorder = parseFloat(item.reorderPoint as any);
                    if (!reorder || reorder === 0) continue;
                    const percentRemaining = (current / reorder) * 100;
                    const thresholdValue = parseFloat(t.thresholdValue as any);

                    let conditionMet = false;
                    const cmp = t.comparisonType || "less_than_or_equal";
                    if (t.thresholdType === "inventory_low_stock_percent") {
                        if (cmp === "less_than_or_equal")
                            conditionMet = percentRemaining <= thresholdValue;
                    } else if (
                        t.thresholdType === "inventory_low_stock_absolute"
                    ) {
                        if (cmp === "less_than_or_equal")
                            conditionMet = current <= thresholdValue;
                    }

                    if (conditionMet) {
                        const dedupKey = `${t.thresholdType}:${item.id}:${t.thresholdValue}:${t.alertLevel}`;
                        if (!recentGeneratedAlerts.has(dedupKey)) {
                            alertsToCreate.push({
                                type: "threshold_exceeded",
                                severity: t.alertLevel,
                                title: `Low Stock: ${item.name}`,
                                message: `Stock level for ${
                                    item.name
                                } is ${current} (${percentRemaining.toFixed(
                                    1
                                )}% of reorder). Threshold: ${thresholdValue}`,
                                farmSection: item.storageLocation || null,
                                isRead: false,
                                userId: (req as any).user?.id || null,
                            });
                            recentGeneratedAlerts.set(dedupKey, now);
                        }
                    }
                }
            }
            if (alertsToCreate.length > 0) {
                for (const a of alertsToCreate.slice(0, 20)) {
                    try {
                        const created = await storage.createAlert(a);
                        // Dispatch notification asynchronously (no await block overall loop time)
                        dispatchAlert({
                            id: created.id,
                            title: created.title || "",
                            message: created.message || "",
                            severity: created.severity || "info",
                            createdAt: created.createdAt || new Date(),
                        }).catch(() => {});
                    } catch (e) {
                        /* ignore */
                    }
                }
            }
            res.json(items);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            res.status(500).json({ message: "Failed to fetch inventory" });
        }
    });

    app.post(
        "/api/inventory",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const itemData = insertInventoryItemSchema.parse(req.body);
                const item = await storage.createInventoryItem(itemData);
                res.status(201).json(item);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    res.status(400).json({
                        message: "Invalid inventory data",
                        errors: error.errors,
                    });
                } else {
                    console.error("Error creating inventory item:", error);
                    res.status(500).json({
                        message: "Failed to create inventory item",
                    });
                }
            }
        }
    );

    app.put(
        "/api/inventory/:id",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { id } = req.params;
                const updates = insertInventoryItemSchema
                    .partial()
                    .parse(req.body);
                const item = await storage.updateInventoryItem(id, updates);
                res.json(item);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    res.status(400).json({
                        message: "Invalid inventory data",
                        errors: error.errors,
                    });
                } else {
                    console.error("Error updating inventory item:", error);
                    res.status(500).json({
                        message: "Failed to update inventory item",
                    });
                }
            }
        }
    );

    app.get("/api/inventory/low-stock", isAuthenticated, async (req, res) => {
        try {
            const items = await storage.getLowStockItems();
            res.json(items);
        } catch (error) {
            console.error("Error fetching low stock items:", error);
            res.status(500).json({
                message: "Failed to fetch low stock items",
            });
        }
    });

    app.get(
        "/api/inventory/expiring/:days",
        isAuthenticated,
        async (req, res) => {
            try {
                const days = parseInt(req.params.days);
                const items = await storage.getExpiringItems(days);
                res.json(items);
            } catch (error) {
                console.error("Error fetching expiring items:", error);
                res.status(500).json({
                    message: "Failed to fetch expiring items",
                });
            }
        }
    );

    // Supplier Routes
    app.get("/api/suppliers", isAuthenticated, async (req, res) => {
        try {
            const suppliers = await storage.getSuppliers();
            res.json(suppliers);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            res.status(500).json({ message: "Failed to fetch suppliers" });
        }
    });

    app.post("/api/suppliers", isAuthenticated, async (req, res) => {
        try {
            const supplierData = insertSupplierSchema.parse(req.body);
            const supplier = await storage.createSupplier(supplierData);
            res.status(201).json(supplier);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid supplier data",
                    errors: error.errors,
                });
            } else {
                console.error("Error creating supplier:", error);
                res.status(500).json({ message: "Failed to create supplier" });
            }
        }
    });

    // Employee Routes
    app.get("/api/employees", isAuthenticated, async (req, res) => {
        try {
            const employees = await storage.getEmployees();
            res.json(employees);
        } catch (error) {
            console.error("Error fetching employees:", error);
            res.status(500).json({ message: "Failed to fetch employees" });
        }
    });

    app.get("/api/employees/next-id", isAuthenticated, async (req, res) => {
        try {
            const nextId = await storage.generateUniqueEmployeeId();
            res.json({ employeeId: nextId });
        } catch (error) {
            console.error("Error generating employee ID:", error);
            res.status(500).json({ message: "Failed to generate employee ID" });
        }
    });

    app.post("/api/employees", isAuthenticated, async (req, res) => {
        try {
            console.log(
                "Employee creation request body:",
                JSON.stringify(req.body, null, 2)
            );
            const employeeData = insertEmployeeSchema.parse(req.body);
            const employee = await storage.createEmployee(employeeData);
            res.status(201).json(employee);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Employee validation errors:", error.errors);
                res.status(400).json({
                    message: "Invalid employee data",
                    errors: error.errors,
                });
            } else if (error instanceof Error) {
                console.error("Error creating employee:", error);

                // Handle duplicate key constraint violation
                if (
                    error.message.includes(
                        'duplicate key value violates unique constraint "employees_employee_id_unique"'
                    )
                ) {
                    res.status(409).json({
                        message:
                            "Employee ID already exists. Please use a different Employee ID.",
                        field: "employeeId",
                    });
                } else if (
                    error.message.includes(
                        'duplicate key value violates unique constraint "employees_email_unique"'
                    )
                ) {
                    res.status(409).json({
                        message:
                            "Email address already exists. Please use a different email address.",
                        field: "email",
                    });
                } else {
                    res.status(500).json({
                        message: "Failed to create employee",
                    });
                }
            } else {
                console.error("Unknown error creating employee:", error);
                res.status(500).json({ message: "Failed to create employee" });
            }
        }
    });

    app.put("/api/employees/:id", isAuthenticated, async (req, res) => {
        try {
            const { id } = req.params;
            const updates = insertEmployeeSchema.partial().parse(req.body);
            const employee = await storage.updateEmployee(id, updates);
            res.json(employee);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid employee data",
                    errors: error.errors,
                });
            } else {
                console.error("Error updating employee:", error);
                res.status(500).json({ message: "Failed to update employee" });
            }
        }
    });

    app.get("/api/employees/active", isAuthenticated, async (req, res) => {
        try {
            const employees = await storage.getActiveEmployees();
            res.json(employees);
        } catch (error) {
            console.error("Error fetching active employees:", error);
            res.status(500).json({
                message: "Failed to fetch active employees",
            });
        }
    });

    // Financial Transaction Routes
    app.get("/api/finances", isAuthenticated, async (req, res) => {
        try {
            const { type, limit } = req.query;
            let transactions;

            if (type) {
                transactions = await storage.getTransactionsByType(
                    type as string,
                    limit ? parseInt(limit as string) : undefined
                );
            } else {
                transactions = await storage.getFinancialTransactions(
                    limit ? parseInt(limit as string) : undefined
                );
            }

            res.json(transactions);
        } catch (error) {
            console.error("Error fetching financial transactions:", error);
            res.status(500).json({
                message: "Failed to fetch financial transactions",
            });
        }
    });

    app.post("/api/finances", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.id; // fixed
            const transactionData = insertFinancialTransactionSchema.parse({
                ...req.body,
                createdBy: userId,
            });

            const transaction = await storage.createFinancialTransaction(
                transactionData
            );
            res.status(201).json(transaction);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid transaction data",
                    errors: error.errors,
                });
            } else {
                console.error("Error creating financial transaction:", error);
                res.status(500).json({
                    message: "Failed to create financial transaction",
                });
            }
        }
    });

    app.get(
        "/api/finances/range/:startDate/:endDate",
        isAuthenticated,
        async (req, res) => {
            try {
                const { startDate, endDate } = req.params;
                const transactions = await storage.getTransactionsByDateRange(
                    startDate,
                    endDate
                );
                res.json(transactions);
            } catch (error) {
                console.error(
                    "Error fetching transactions by date range:",
                    error
                );
                res.status(500).json({
                    message: "Failed to fetch transactions",
                });
            }
        }
    );

    // Health Records Routes
    app.get("/api/health", isAuthenticated, async (req, res) => {
        try {
            const { limit } = req.query;
            const records = await storage.getHealthRecords(
                limit ? parseInt(limit as string) : undefined
            );
            res.json(records);
        } catch (error) {
            console.error("Error fetching health records:", error);
            res.status(500).json({ message: "Failed to fetch health records" });
        }
    });

    app.post("/api/health", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.id; // fixed
            const recordData = insertHealthRecordSchema.parse({
                ...req.body,
                recordedBy: userId,
            });

            const record = await storage.createHealthRecord(recordData);
            res.status(201).json(record);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid health record data",
                    errors: error.errors,
                });
            } else {
                console.error("Error creating health record:", error);
                res.status(500).json({
                    message: "Failed to create health record",
                });
            }
        }
    });

    app.get("/api/health/alerts", isAuthenticated, async (req, res) => {
        try {
            const alerts = await storage.getRecentHealthAlerts();
            res.json(alerts);
        } catch (error) {
            console.error("Error fetching health alerts:", error);
            res.status(500).json({ message: "Failed to fetch health alerts" });
        }
    });

    // Production Data Routes
    app.get("/api/production", isAuthenticated, async (req, res) => {
        try {
            const { limit } = req.query;
            const data = await storage.getProductionData(
                limit ? parseInt(limit as string) : undefined
            );
            res.json(data);
        } catch (error) {
            console.error("Error fetching production data:", error);
            res.status(500).json({
                message: "Failed to fetch production data",
            });
        }
    });

    app.post("/api/production", isAuthenticated, async (req, res) => {
        try {
            const productionData = insertProductionDataSchema.parse(req.body);
            const data = await storage.createProductionData(productionData);
            res.status(201).json(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Invalid production data",
                    errors: error.errors,
                });
            } else {
                console.error("Error creating production data:", error);
                res.status(500).json({
                    message: "Failed to create production data",
                });
            }
        }
    });

    app.get(
        "/api/production/range/:startDate/:endDate",
        isAuthenticated,
        async (req, res) => {
            try {
                const { startDate, endDate } = req.params;
                const data = await storage.getProductionByDateRange(
                    startDate,
                    endDate
                );
                res.json(data);
            } catch (error) {
                console.error(
                    "Error fetching production data by date range:",
                    error
                );
                res.status(500).json({
                    message: "Failed to fetch production data",
                });
            }
        }
    );

    app.get("/api/production/today", isAuthenticated, async (req, res) => {
        try {
            const data = await storage.getTodayProduction();
            res.json(data);
        } catch (error) {
            console.error("Error fetching today's production:", error);
            res.status(500).json({
                message: "Failed to fetch today's production",
            });
        }
    });

    // ======= PHASE 2: KPI & ANALYTICS ROUTES =======

    // Calculate daily KPIs for a specific date
    app.post("/api/kpi/calculate-daily", isAuthenticated, async (req, res) => {
        try {
            const { date, farmSection } = req.body;
            const targetDate = date ? new Date(date) : new Date();

            await kpiEngine.calculateDailyKpis(targetDate, farmSection);

            res.json({
                message: "Daily KPIs calculated successfully",
                date: targetDate.toISOString().split("T")[0],
                farmSection: farmSection || "all",
            });
        } catch (error) {
            console.error("Error calculating daily KPIs:", error);
            res.status(500).json({
                message: "Failed to calculate daily KPIs",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Get dashboard data with KPIs
    app.get("/api/dashboard", isAuthenticated, async (req, res) => {
        try {
            const userId = (req as any).user?.id;
            const { farmSection, dateRange } = req.query;

            const dashboardData = await kpiEngine.getDashboardData(userId, {
                farmSection: farmSection as string,
                dateRange: dateRange as string,
            });

            res.json(dashboardData);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            res.status(500).json({
                message: "Failed to fetch dashboard data",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Calculate KPI trends for specific metrics
    app.post("/api/kpi/calculate-trends", isAuthenticated, async (req, res) => {
        try {
            const { kpiName, category, period } = req.body;

            await kpiEngine.calculateKpiTrends(
                kpiName,
                category,
                period || "day"
            );

            res.json({
                message: "KPI trends calculated successfully",
                kpiName,
                category,
                period: period || "day",
            });
        } catch (error) {
            console.error("Error calculating KPI trends:", error);
            res.status(500).json({
                message: "Failed to calculate KPI trends",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Trigger bulk KPI calculation for date range
    app.post("/api/kpi/calculate-bulk", isAuthenticated, async (req, res) => {
        try {
            const { startDate, endDate, farmSection } = req.body;
            const start = new Date(startDate);
            const end = new Date(endDate);

            const results = [];
            const currentDate = new Date(start);

            while (currentDate <= end) {
                await kpiEngine.calculateDailyKpis(
                    new Date(currentDate),
                    farmSection
                );
                results.push(currentDate.toISOString().split("T")[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            res.json({
                message: "Bulk KPI calculation completed",
                datesProcessed: results,
                farmSection: farmSection || "all",
            });
        } catch (error) {
            console.error("Error in bulk KPI calculation:", error);
            res.status(500).json({
                message: "Failed to calculate bulk KPIs",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // ======= DEVELOPMENT TESTING ENDPOINT =======

    // Test endpoint to populate sample data and test dashboard (development only)
    app.post("/api/dev/populate-test-data", async (req, res) => {
        if (process.env.NODE_ENV !== "development") {
            return res.status(403).json({
                message: "This endpoint is only available in development",
            });
        }

        try {
            console.log("🌱 Populating sample farm data...");

            const today = new Date();
            const dateStr = today.toISOString().split("T")[0];

            // Sample egg collection activities
            await db.insert(dailyActivities).values([
                {
                    userId: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                    activityType: "egg_collection",
                    farmSection: "section-a",
                    data: {
                        quantity: 850,
                        qualityGrade: "A",
                        weight: 51.0,
                        collectorCount: 2,
                        timeOfCollection: "06:30",
                    },
                    notes: "Morning collection from Section A",
                    timestamp: today,
                },
                {
                    userId: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                    activityType: "egg_collection",
                    farmSection: "section-a",
                    data: {
                        quantity: 720,
                        qualityGrade: "A",
                        weight: 43.2,
                        collectorCount: 2,
                        timeOfCollection: "14:30",
                    },
                    notes: "Afternoon collection from Section A",
                    timestamp: today,
                },
                {
                    userId: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                    activityType: "feed_distribution",
                    farmSection: "section-a",
                    data: {
                        amount: 120.5,
                        feedType: "layer_mash",
                        distributorCount: 1,
                    },
                    notes: "Morning feeding",
                    timestamp: today,
                },
                {
                    userId: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                    activityType: "mortality",
                    farmSection: "section-a",
                    data: {
                        count: 2,
                        cause: "natural",
                        ageGroup: "layers",
                    },
                    notes: "Natural deaths overnight",
                    timestamp: today,
                },
            ]);

            // Sample financial transactions
            await db.insert(financialTransactions).values([
                {
                    type: "revenue",
                    category: "egg_sales",
                    amount: "1248.50",
                    description: "Daily egg sales to local distributor",
                    transactionDate: dateStr,
                    createdBy: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                },
                {
                    type: "expense",
                    category: "feed",
                    amount: "185.75",
                    description: "Layer mash purchase",
                    transactionDate: dateStr,
                    createdBy: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                },
                {
                    type: "expense",
                    category: "labor",
                    amount: "120.00",
                    description: "Daily labor costs",
                    transactionDate: dateStr,
                    createdBy: "1b14d23a-410b-4f73-9fd3-1a1e29b9f018",
                },
            ]);

            console.log("✅ Sample data inserted successfully");

            // Calculate KPIs for today
            console.log("📊 Calculating KPIs for today...");
            await kpiEngine.calculateDailyKpis(today, "section-a");
            await kpiEngine.calculateDailyKpis(today); // Overall farm KPIs

            console.log("✅ KPIs calculated successfully");

            // Test dashboard data retrieval
            console.log("📈 Testing dashboard data retrieval...");
            const dashboardData = await kpiEngine.getDashboardData(
                "1b14d23a-410b-4f73-9fd3-1a1e29b9f018"
            );

            console.log("🎯 Dashboard Summary:");
            console.log(
                `  Total Revenue: $${dashboardData.summary.totalRevenue}`
            );
            console.log(
                `  Total Expenses: $${dashboardData.summary.totalExpenses}`
            );
            console.log(
                `  Profit Margin: ${dashboardData.summary.profitMargin.toFixed(
                    2
                )}%`
            );
            console.log(
                `  Egg Production: ${dashboardData.summary.eggProduction} eggs`
            );
            console.log(
                `  Mortality Rate: ${dashboardData.summary.mortalityRate.toFixed(
                    2
                )}%`
            );
            console.log(
                `  Active Alerts: ${dashboardData.summary.alertsCount.total}`
            );

            res.json({
                message:
                    "Sample data populated and KPIs calculated successfully",
                summary: dashboardData.summary,
                kpiCount: dashboardData.kpis.length,
                alertsCount: dashboardData.recentAlerts.length,
            });
        } catch (error) {
            console.error("❌ Error in test:", error);
            res.status(500).json({
                message: "Failed to populate test data",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Inventory Adjustment Routes
    app.post(
        "/api/inventory/:id/adjust",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { id } = req.params;
                const { adjustmentType, quantity, reason } = req.body;
                if (!adjustmentType || !quantity) {
                    return res.status(400).json({
                        message: "adjustmentType and quantity required",
                    });
                }
                const adj = await storage.createInventoryAdjustment({
                    itemId: id,
                    adjustmentType,
                    quantity: parseFloat(quantity),
                    reason,
                });
                res.status(201).json(adj);
            } catch (error: any) {
                console.error("Error creating inventory adjustment:", error);
                res.status(500).json({
                    message: error.message || "Failed to adjust inventory",
                });
            }
        }
    );

    app.get(
        "/api/inventory/:id/adjustments",
        isAuthenticated,
        async (req, res) => {
            try {
                const { id } = req.params;
                const adjustments = await storage.getInventoryAdjustments(id);
                res.json(adjustments);
            } catch (error) {
                console.error("Error fetching inventory adjustments:", error);
                res.status(500).json({
                    message: "Failed to fetch inventory adjustments",
                });
            }
        }
    );

    app.get(
        "/api/reports/available",
        isAuthenticated,
        authorize(["admin"]),
        (req, res) => {
            res.json(listAvailableReports());
        }
    );

    app.post(
        "/api/reports/generate",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { types } = req.body as { types: string[] };
                if (!Array.isArray(types) || types.length === 0) {
                    return res
                        .status(400)
                        .json({ message: "No report types provided" });
                }
                const outputs: {
                    filename: string;
                    mime: string;
                    content: string;
                }[] = [];
                for (const t of types) {
                    try {
                        const r = await generateReport(t as any);
                        outputs.push(r);
                    } catch (e) {
                        outputs.push({
                            filename: `${t}.error.txt`,
                            mime: "text/plain",
                            content: "Unsupported report",
                        });
                    }
                }
                if (outputs.length === 1) {
                    const o = outputs[0];
                    res.setHeader("Content-Type", o.mime);
                    res.setHeader(
                        "Content-Disposition",
                        `attachment; filename="${o.filename}"`
                    );
                    return res.send(o.content);
                }
                // Bundle multiple simple CSVs into a naive concatenation separated by blank line
                const bundle = outputs
                    .map((o) => `# ${o.filename}\n${o.content}`)
                    .join("\n\n");
                res.setHeader("Content-Type", "text/plain");
                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="reports.txt"'
                );
                res.send(bundle);
            } catch (error) {
                console.error("Report generation failed", error);
                res.status(500).json({ message: "Report generation failed" });
            }
        }
    );

    app.get(
        "/api/admin/users",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const usersList = await storage.getAllUsers();
                res.json(
                    usersList.map((u) => ({
                        id: u.id,
                        email: u.email,
                        role: u.role,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        createdAt: u.createdAt,
                    }))
                );
            } catch (e) {
                res.status(500).json({ message: "Failed to fetch users" });
            }
        }
    );

    app.post(
        "/api/admin/users",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { email, password, firstName, lastName, role } =
                    req.body || {};
                if (!email || !password)
                    return res
                        .status(400)
                        .json({ message: "Email and password required" });
                const existing = await storage.getUserByEmail(email);
                if (existing)
                    return res
                        .status(409)
                        .json({ message: "Email already exists" });
                const bcrypt = await import("bcrypt");
                const hash = await bcrypt.hash(password, 12);
                const newUser = await storage.createUser({
                    email,
                    password: hash,
                    firstName,
                    lastName,
                    role: role === "admin" ? "admin" : "staff",
                });
                res.status(201).json({
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role,
                });
            } catch (e) {
                console.error(e);
                res.status(500).json({ message: "Failed to create user" });
            }
        }
    );

    app.put(
        "/api/admin/users/:id/role",
        isAuthenticated,
        authorize(["admin"]),
        async (req: any, res) => {
            try {
                const { id } = req.params;
                const { role } = req.body || {};
                if (!["admin", "staff"].includes(role))
                    return res.status(400).json({ message: "Invalid role" });
                if (req.user?.id === id && role === "staff") {
                    const usersList = await storage.getAllUsers();
                    const otherAdmins = usersList.filter(
                        (u) => u.role === "admin" && u.id !== id
                    );
                    if (otherAdmins.length === 0) {
                        return res
                            .status(400)
                            .json({ message: "Cannot demote the last admin" });
                    }
                }
                const updated = await storage.updateUser(id, { role });
                res.json({ id: updated.id, role: updated.role });
            } catch (e) {
                res.status(500).json({ message: "Failed to update role" });
            }
        }
    );

    // Permission Management (admin only)
    app.get(
        "/api/admin/permissions",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const perms = await storage.listPermissions();
                res.json(perms);
            } catch (e) {
                res.status(500).json({
                    message: "Failed to fetch permissions",
                });
            }
        }
    );

    app.post(
        "/api/admin/permissions",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { code, description } = req.body || {};
                if (!code)
                    return res.status(400).json({ message: "Code required" });
                const perm = await storage.createPermission({
                    code,
                    description,
                });
                res.status(201).json(perm);
            } catch (e: any) {
                if (e.message?.includes("duplicate key")) {
                    return res
                        .status(409)
                        .json({ message: "Permission already exists" });
                }
                res.status(500).json({
                    message: "Failed to create permission",
                });
            }
        }
    );

    app.get(
        "/api/admin/users/:id/permissions",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { id } = req.params;
                const userPerms = await storage.getUserPermissions(id);
                res.json(userPerms);
            } catch (e) {
                res.status(500).json({
                    message: "Failed to fetch user permissions",
                });
            }
        }
    );

    app.post(
        "/api/admin/users/:id/permissions",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { id } = req.params;
                const { code } = req.body || {};
                if (!code)
                    return res.status(400).json({ message: "Code required" });
                await storage.assignPermissionToUser(id, code);
                res.status(204).send();
            } catch (e) {
                res.status(500).json({
                    message: "Failed to assign permission",
                });
            }
        }
    );

    app.delete(
        "/api/admin/users/:id/permissions/:code",
        isAuthenticated,
        authorize(["admin"]),
        async (req, res) => {
            try {
                const { id, code } = req.params as any;
                await storage.revokePermissionFromUser(id, code);
                res.status(204).send();
            } catch (e) {
                res.status(500).json({
                    message: "Failed to revoke permission",
                });
            }
        }
    );

    const httpServer = createServer(app);
    return httpServer;
}
