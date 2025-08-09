import {
    users,
    dailyActivities,
    alertThresholds,
    alerts,
    inventoryItems,
    suppliers,
    employees,
    financialTransactions,
    healthRecords,
    productionData,
    refreshTokens,
    inventoryAdjustments,
    permissions,
    userPermissions,
    type User,
    type UpsertUser,
    type RefreshToken,
    type InsertRefreshToken,
    type DailyActivity,
    type InsertDailyActivity,
    type AlertThreshold,
    type InsertAlertThreshold,
    type Alert,
    type InsertAlert,
    type InventoryItem,
    type InsertInventoryItem,
    type Supplier,
    type InsertSupplier,
    type Employee,
    type InsertEmployee,
    type FinancialTransaction,
    type InsertFinancialTransaction,
    type HealthRecord,
    type InsertHealthRecord,
    type ProductionData,
    type InsertProductionData,
    type Permission,
    type InsertPermission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
    // User operations (for local authentication)
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    createUser(user: Omit<UpsertUser, "id">): Promise<User>;
    upsertUser(user: UpsertUser): Promise<User>;
    getAllUsers(): Promise<User[]>;
    updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
    deleteUser(id: string): Promise<void>;
    incrementFailedAttempts(userId: string): Promise<void>;
    resetFailedAttempts(userId: string): Promise<void>;
    lockUser(userId: string, lockedUntil: Date): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;

    // Refresh token operations
    createRefreshToken(
        token: Omit<InsertRefreshToken, "id">
    ): Promise<RefreshToken>;
    getRefreshToken(token: string): Promise<RefreshToken | undefined>;
    revokeRefreshToken(token: string): Promise<void>;
    revokeUserRefreshTokens(userId: string): Promise<void>;

    // Daily Activities
    createDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity>;
    updateDailyActivity(
        activityId: string,
        updateData: any,
        userId: string
    ): Promise<DailyActivity | null>;
    getDailyActivities(
        userId?: string,
        limit?: number
    ): Promise<DailyActivity[]>;
    getDailyActivitiesByDate(date: string): Promise<DailyActivity[]>;
    getDailyActivitiesByType(
        type: string,
        limit?: number
    ): Promise<DailyActivity[]>;

    // Inventory
    getInventoryItems(): Promise<InventoryItem[]>;
    createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
    updateInventoryItem(
        id: string,
        updates: Partial<InsertInventoryItem>
    ): Promise<InventoryItem>;
    getLowStockItems(): Promise<InventoryItem[]>;
    getExpiringItems(days: number): Promise<InventoryItem[]>;

    // Suppliers
    getSuppliers(): Promise<Supplier[]>;
    createSupplier(supplier: InsertSupplier): Promise<Supplier>;
    getSupplier(id: string): Promise<Supplier | undefined>;

    // Employees
    getEmployees(): Promise<Employee[]>;
    createEmployee(employee: InsertEmployee): Promise<Employee>;
    updateEmployee(
        id: string,
        updates: Partial<InsertEmployee>
    ): Promise<Employee>;
    getEmployee(id: string): Promise<Employee | undefined>;
    getActiveEmployees(): Promise<Employee[]>;

    // Financial Transactions
    getFinancialTransactions(limit?: number): Promise<FinancialTransaction[]>;
    createFinancialTransaction(
        transaction: InsertFinancialTransaction
    ): Promise<FinancialTransaction>;
    getTransactionsByType(
        type: string,
        limit?: number
    ): Promise<FinancialTransaction[]>;
    getTransactionsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<FinancialTransaction[]>;

    // Health Records
    getHealthRecords(limit?: number): Promise<HealthRecord[]>;
    createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord>;
    getRecentHealthAlerts(): Promise<HealthRecord[]>;

    // Production Data
    getProductionData(limit?: number): Promise<ProductionData[]>;
    createProductionData(data: InsertProductionData): Promise<ProductionData>;
    getProductionByDateRange(
        startDate: string,
        endDate: string
    ): Promise<ProductionData[]>;
    getTodayProduction(): Promise<ProductionData | undefined>;

    // Dashboard Analytics
    getDashboardMetrics(): Promise<any>;

    // Enhanced Activities (Phase 1)
    createDailyActivityWithValidation(
        activity: InsertDailyActivity & { farmSection?: string }
    ): Promise<DailyActivity>;
    getActivitiesWithMetrics(filters: {
        dateFrom?: Date;
        dateTo?: Date;
        activityType?: string;
        farmSection?: string;
        status?: string;
        userId?: string;
    }): Promise<(DailyActivity & { metrics?: any })[]>;
    getActivitySummary(
        dateFrom: Date,
        dateTo: Date
    ): Promise<{
        totalActivities: number;
        byType: Record<string, number>;
        alerts: number;
        completionRate: number;
    }>;

    // Alert System
    createAlert(alert: InsertAlert): Promise<Alert>;
    getAlerts(userId?: string, isRead?: boolean): Promise<Alert[]>;
    markAlertAsRead(alertId: string, userId: string): Promise<void>;
    getAlertThresholds(): Promise<AlertThreshold[]>;
    createAlertThreshold(
        threshold: InsertAlertThreshold
    ): Promise<AlertThreshold>;
    updateAlertThreshold(
        id: string,
        updates: Partial<InsertAlertThreshold>
    ): Promise<AlertThreshold>;
    checkActivityThresholds(activity: DailyActivity): Promise<Alert[]>;
    createInventoryAdjustment(data: {
        itemId: string;
        adjustmentType: string;
        quantity: number;
        reason?: string;
    }): Promise<any>;
    getInventoryAdjustments(itemId: string): Promise<any[]>;

    // Permissions
    listPermissions(): Promise<Permission[]>;
    createPermission(p: InsertPermission): Promise<Permission>;
    assignPermissionToUser(userId: string, code: string): Promise<void>;
    revokePermissionFromUser(userId: string, code: string): Promise<void>;
    getUserPermissions(userId: string): Promise<string[]>;
    userHasPermission(userId: string, code: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
    // User operations (for local authentication)
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        return user;
    }

    async createUser(userData: Omit<UpsertUser, "id">): Promise<User> {
        const [u] = await db.insert(users).values(userData).returning();
        return u;
    }

    async upsertUser(userData: UpsertUser): Promise<User> {
        const [user] = await db
            .insert(users)
            .values(userData)
            .onConflictDoUpdate({
                target: users.id,
                set: {
                    ...userData,
                    updatedAt: new Date(),
                },
            })
            .returning();
        return user;
    }

    async incrementFailedAttempts(userId: string): Promise<void> {
        await db
            .update(users)
            .set({
                failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async resetFailedAttempts(userId: string): Promise<void> {
        await db
            .update(users)
            .set({
                failedLoginAttempts: 0,
                lockedUntil: null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async lockUser(userId: string, lockedUntil: Date): Promise<void> {
        await db
            .update(users)
            .set({
                lockedUntil,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async updateLastLogin(userId: string): Promise<void> {
        await db
            .update(users)
            .set({
                lastLoginAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
    }

    async getAllUsers(): Promise<User[]> {
        return await db.select().from(users).orderBy(users.createdAt);
    }

    async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
        const [updatedUser] = await db
            .update(users)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();
        return updatedUser;
    }

    async deleteUser(id: string): Promise<void> {
        // Note: In a production system, you might want to soft delete instead
        // or handle cascade deletion of related records
        await db.delete(users).where(eq(users.id, id));
    }

    // Refresh token operations
    async createRefreshToken(
        tokenData: Omit<InsertRefreshToken, "id">
    ): Promise<RefreshToken> {
        const [token] = await db
            .insert(refreshTokens)
            .values(tokenData)
            .returning();
        return token;
    }

    async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
        const [refreshToken] = await db
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.token, token));
        return refreshToken;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        await db
            .update(refreshTokens)
            .set({ isRevoked: true })
            .where(eq(refreshTokens.token, token));
    }

    async revokeUserRefreshTokens(userId: string): Promise<void> {
        await db
            .update(refreshTokens)
            .set({ isRevoked: true })
            .where(eq(refreshTokens.userId, userId));
    }

    // Daily Activities
    async createDailyActivity(
        activity: InsertDailyActivity
    ): Promise<DailyActivity> {
        const [newActivity] = await db
            .insert(dailyActivities)
            .values(activity)
            .returning();
        return newActivity;
    }

    async updateDailyActivity(
        activityId: string,
        updateData: any,
        userId: string
    ): Promise<DailyActivity | null> {
        // Only allow users to update their own activities or allow supervisors to update any
        const activity = await db.query.dailyActivities.findFirst({
            where: eq(dailyActivities.id, activityId),
        });

        if (!activity) {
            return null;
        }

        // For now, allow any authenticated user to update their own activities
        // In a more complex system, you'd add role-based permissions
        if (activity.userId !== userId) {
            // Check if user is a supervisor/admin (simplified check)
            const user = await this.getUser(userId);
            if (
                !user ||
                !["admin", "supervisor", "general_manager", "ceo"].includes(
                    user.role || ""
                )
            ) {
                return null; // Unauthorized
            }
        }

        const [updatedActivity] = await db
            .update(dailyActivities)
            .set({
                ...updateData,
                // Add any additional fields like updatedAt if you have them
            })
            .where(eq(dailyActivities.id, activityId))
            .returning();

        return updatedActivity || null;
    }

    async getDailyActivities(
        userId?: string,
        limit = 50
    ): Promise<DailyActivity[]> {
        if (userId) {
            return await db
                .select()
                .from(dailyActivities)
                .where(eq(dailyActivities.userId, userId))
                .orderBy(desc(dailyActivities.timestamp))
                .limit(limit);
        }

        return await db
            .select()
            .from(dailyActivities)
            .orderBy(desc(dailyActivities.timestamp))
            .limit(limit);
    }

    async getDailyActivitiesByDate(date: string): Promise<DailyActivity[]> {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        return await db
            .select()
            .from(dailyActivities)
            .where(
                and(
                    gte(dailyActivities.timestamp, startDate),
                    lte(dailyActivities.timestamp, endDate)
                )
            )
            .orderBy(desc(dailyActivities.timestamp));
    }

    async getDailyActivitiesByType(
        type: string,
        limit = 50
    ): Promise<DailyActivity[]> {
        return await db
            .select()
            .from(dailyActivities)
            .where(eq(dailyActivities.activityType, type))
            .orderBy(desc(dailyActivities.timestamp))
            .limit(limit);
    }

    // Inventory
    async getInventoryItems(): Promise<InventoryItem[]> {
        return await db
            .select()
            .from(inventoryItems)
            .orderBy(inventoryItems.name);
    }

    async createInventoryItem(
        item: InsertInventoryItem
    ): Promise<InventoryItem> {
        const [newItem] = await db
            .insert(inventoryItems)
            .values(item)
            .returning();
        return newItem;
    }

    async updateInventoryItem(
        id: string,
        updates: Partial<InsertInventoryItem>
    ): Promise<InventoryItem> {
        const [updatedItem] = await db
            .update(inventoryItems)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(inventoryItems.id, id))
            .returning();
        return updatedItem;
    }

    async getLowStockItems(): Promise<InventoryItem[]> {
        return await db
            .select()
            .from(inventoryItems)
            .where(
                sql`${inventoryItems.currentStock} <= ${inventoryItems.reorderPoint}`
            );
    }

    async getExpiringItems(days: number): Promise<InventoryItem[]> {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);

        return await db
            .select()
            .from(inventoryItems)
            .where(
                and(
                    lte(
                        inventoryItems.expirationDate,
                        expirationDate.toISOString().split("T")[0]
                    ),
                    gte(
                        inventoryItems.expirationDate,
                        new Date().toISOString().split("T")[0]
                    )
                )
            );
    }

    // Suppliers
    async getSuppliers(): Promise<Supplier[]> {
        return await db.select().from(suppliers).orderBy(suppliers.name);
    }

    async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
        const [newSupplier] = await db
            .insert(suppliers)
            .values(supplier)
            .returning();
        return newSupplier;
    }

    async getSupplier(id: string): Promise<Supplier | undefined> {
        const [supplier] = await db
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, id));
        return supplier;
    }

    // Employees
    async getEmployees(): Promise<Employee[]> {
        return await db
            .select()
            .from(employees)
            .orderBy(employees.firstName, employees.lastName);
    }

    async generateUniqueEmployeeId(): Promise<string> {
        // Get the latest employee ID to determine the next number
        const latestEmployee = await db
            .select({ employeeId: employees.employeeId })
            .from(employees)
            .where(sql`${employees.employeeId} ~ '^EM[0-9]+$'`)
            .orderBy(
                sql`CAST(SUBSTRING(${employees.employeeId} FROM 3) AS INTEGER) DESC`
            )
            .limit(1);

        let nextNumber = 1;
        if (latestEmployee.length > 0) {
            const currentNumber = parseInt(
                latestEmployee[0].employeeId.substring(2)
            );
            nextNumber = currentNumber + 1;
        }

        // Generate new ID and check if it exists (in case of custom IDs)
        let newId = `EM${nextNumber}`;
        while (true) {
            const existing = await db
                .select({ employeeId: employees.employeeId })
                .from(employees)
                .where(eq(employees.employeeId, newId))
                .limit(1);

            if (existing.length === 0) {
                break;
            }
            nextNumber++;
            newId = `EM${nextNumber}`;
        }

        return newId;
    }

    async createEmployee(employee: InsertEmployee): Promise<Employee> {
        const [newEmployee] = await db
            .insert(employees)
            .values(employee)
            .returning();
        return newEmployee;
    }

    async updateEmployee(
        id: string,
        updates: Partial<InsertEmployee>
    ): Promise<Employee> {
        const [updatedEmployee] = await db
            .update(employees)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(employees.id, id))
            .returning();
        return updatedEmployee;
    }

    async getEmployee(id: string): Promise<Employee | undefined> {
        const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, id));
        return employee;
    }

    async getActiveEmployees(): Promise<Employee[]> {
        return await db
            .select()
            .from(employees)
            .where(eq(employees.status, "active"))
            .orderBy(employees.firstName, employees.lastName);
    }

    // Financial Transactions
    async getFinancialTransactions(
        limit = 100
    ): Promise<FinancialTransaction[]> {
        return await db
            .select()
            .from(financialTransactions)
            .orderBy(desc(financialTransactions.transactionDate))
            .limit(limit);
    }

    async createFinancialTransaction(
        transaction: InsertFinancialTransaction
    ): Promise<FinancialTransaction> {
        const [newTransaction] = await db
            .insert(financialTransactions)
            .values(transaction)
            .returning();
        return newTransaction;
    }

    async getTransactionsByType(
        type: string,
        limit = 50
    ): Promise<FinancialTransaction[]> {
        return await db
            .select()
            .from(financialTransactions)
            .where(eq(financialTransactions.type, type))
            .orderBy(desc(financialTransactions.transactionDate))
            .limit(limit);
    }

    async getTransactionsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<FinancialTransaction[]> {
        return await db
            .select()
            .from(financialTransactions)
            .where(
                and(
                    gte(financialTransactions.transactionDate, startDate),
                    lte(financialTransactions.transactionDate, endDate)
                )
            )
            .orderBy(desc(financialTransactions.transactionDate));
    }

    // Health Records
    async getHealthRecords(limit = 100): Promise<HealthRecord[]> {
        return await db
            .select()
            .from(healthRecords)
            .orderBy(desc(healthRecords.recordDate))
            .limit(limit);
    }

    async createHealthRecord(
        record: InsertHealthRecord
    ): Promise<HealthRecord> {
        const [newRecord] = await db
            .insert(healthRecords)
            .values(record)
            .returning();
        return newRecord;
    }

    async getRecentHealthAlerts(): Promise<HealthRecord[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return await db
            .select()
            .from(healthRecords)
            .where(
                and(
                    gte(
                        healthRecords.recordDate,
                        sevenDaysAgo.toISOString().split("T")[0]
                    ),
                    or(
                        like(healthRecords.symptoms, "%mortality%"),
                        like(healthRecords.symptoms, "%disease%"),
                        like(healthRecords.diagnosis, "%urgent%")
                    )
                )
            )
            .orderBy(desc(healthRecords.recordDate));
    }

    // Production Data
    async getProductionData(limit = 100): Promise<ProductionData[]> {
        return await db
            .select()
            .from(productionData)
            .orderBy(desc(productionData.date))
            .limit(limit);
    }

    async createProductionData(
        data: InsertProductionData
    ): Promise<ProductionData> {
        const [newData] = await db
            .insert(productionData)
            .values(data)
            .returning();
        return newData;
    }

    async getProductionByDateRange(
        startDate: string,
        endDate: string
    ): Promise<ProductionData[]> {
        return await db
            .select()
            .from(productionData)
            .where(
                and(
                    gte(productionData.date, startDate),
                    lte(productionData.date, endDate)
                )
            )
            .orderBy(desc(productionData.date));
    }

    async getTodayProduction(): Promise<ProductionData | undefined> {
        const today = new Date().toISOString().split("T")[0];
        const [todayData] = await db
            .select()
            .from(productionData)
            .where(eq(productionData.date, today));
        return todayData;
    }

    // Dashboard Analytics
    async getDashboardMetrics(): Promise<any> {
        const today = new Date().toISOString().split("T")[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

        // Get today's production data
        const todayProduction = await this.getTodayProduction();

        // Get recent activities
        const recentActivities = await this.getDailyActivities(undefined, 10);

        // Get low stock items
        const lowStockItems = await this.getLowStockItems();

        // Get active employees count
        const activeEmployees = await this.getActiveEmployees();

        // Get recent financial data
        const recentTransactions = await this.getTransactionsByDateRange(
            sevenDaysAgoStr,
            today
        );

        // Calculate revenue for today
        const todayRevenue = recentTransactions
            .filter((t) => t.type === "revenue" && t.transactionDate === today)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        return {
            eggProduction: todayProduction?.eggProduction || 0,
            feedConsumption: todayProduction?.feedConsumption || 0,
            mortality: todayProduction?.mortality || 0,
            revenue: todayRevenue,
            recentActivities: recentActivities.slice(0, 5),
            lowStockItems: lowStockItems.slice(0, 4),
            activeEmployeesCount: activeEmployees.length,
            totalEmployees: (await this.getEmployees()).length,
        };
    }

    // Enhanced Activities (Phase 1)
    async createDailyActivityWithValidation(
        activity: InsertDailyActivity & { farmSection?: string }
    ): Promise<DailyActivity> {
        const activityData = {
            ...activity,
            farmSection: activity.farmSection,
            status: activity.status || "pending",
            priority: activity.priority || "normal",
        };

        const [newActivity] = await db
            .insert(dailyActivities)
            .values(activityData)
            .returning();

        // Check for threshold alerts after creating activity
        await this.checkActivityThresholds(newActivity);

        return newActivity;
    }

    async getActivitiesWithMetrics(filters: {
        dateFrom?: Date;
        dateTo?: Date;
        activityType?: string;
        farmSection?: string;
        status?: string;
        userId?: string;
    }): Promise<(DailyActivity & { metrics?: any })[]> {
        const conditions = [];

        if (filters.dateFrom) {
            conditions.push(gte(dailyActivities.createdAt, filters.dateFrom));
        }
        if (filters.dateTo) {
            conditions.push(lte(dailyActivities.createdAt, filters.dateTo));
        }
        if (filters.activityType) {
            conditions.push(
                eq(dailyActivities.activityType, filters.activityType)
            );
        }
        if (filters.farmSection) {
            conditions.push(
                eq(dailyActivities.farmSection, filters.farmSection)
            );
        }
        if (filters.status) {
            conditions.push(eq(dailyActivities.status, filters.status));
        }
        if (filters.userId) {
            conditions.push(eq(dailyActivities.userId, filters.userId));
        }

        const activities =
            conditions.length > 0
                ? await db
                      .select()
                      .from(dailyActivities)
                      .where(and(...conditions))
                      .orderBy(desc(dailyActivities.createdAt))
                : await db
                      .select()
                      .from(dailyActivities)
                      .orderBy(desc(dailyActivities.createdAt));

        // Add basic metrics to each activity
        return activities.map((activity) => ({
            ...activity,
            metrics: {
                efficiency: 85, // Placeholder calculation
                deviation: 0.1,
                trend: "stable" as const,
            },
        }));
    }

    async getActivitySummary(
        dateFrom: Date,
        dateTo: Date
    ): Promise<{
        totalActivities: number;
        byType: Record<string, number>;
        alerts: number;
        completionRate: number;
    }> {
        const activities = await db
            .select()
            .from(dailyActivities)
            .where(
                and(
                    gte(dailyActivities.createdAt, dateFrom),
                    lte(dailyActivities.createdAt, dateTo)
                )
            );

        const totalActivities = activities.length;
        const completedActivities = activities.filter(
            (a) => a.status === "completed"
        ).length;

        const byType = activities.reduce((acc, activity) => {
            acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const alertCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(alerts)
            .where(
                and(
                    gte(alerts.createdAt, dateFrom),
                    lte(alerts.createdAt, dateTo)
                )
            );

        return {
            totalActivities,
            byType,
            alerts: alertCount[0]?.count || 0,
            completionRate:
                totalActivities > 0
                    ? (completedActivities / totalActivities) * 100
                    : 0,
        };
    }

    // Alert System
    async createAlert(alert: InsertAlert): Promise<Alert> {
        const [newAlert] = await db.insert(alerts).values(alert).returning();
        return newAlert;
    }

    async getAlerts(userId?: string, isRead?: boolean): Promise<Alert[]> {
        const conditions = [];
        if (userId) {
            conditions.push(eq(alerts.userId, userId));
        }
        if (isRead !== undefined) {
            conditions.push(eq(alerts.isRead, isRead));
        }

        return conditions.length > 0
            ? await db
                  .select()
                  .from(alerts)
                  .where(and(...conditions))
                  .orderBy(desc(alerts.createdAt))
            : await db.select().from(alerts).orderBy(desc(alerts.createdAt));
    }

    async markAlertAsRead(alertId: string, userId: string): Promise<void> {
        await db
            .update(alerts)
            .set({ isRead: true })
            .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)));
    }

    async getAlertThresholds(): Promise<AlertThreshold[]> {
        return await db
            .select()
            .from(alertThresholds)
            .where(eq(alertThresholds.isActive, true))
            .orderBy(alertThresholds.thresholdType);
    }

    async createAlertThreshold(
        threshold: InsertAlertThreshold
    ): Promise<AlertThreshold> {
        const [newThreshold] = await db
            .insert(alertThresholds)
            .values(threshold)
            .returning();
        return newThreshold;
    }

    async updateAlertThreshold(
        id: string,
        updates: Partial<InsertAlertThreshold>
    ): Promise<AlertThreshold> {
        const [updatedThreshold] = await db
            .update(alertThresholds)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(alertThresholds.id, id))
            .returning();
        return updatedThreshold;
    }

    async checkActivityThresholds(activity: DailyActivity): Promise<Alert[]> {
        const thresholds = await this.getAlertThresholds();
        const triggeredAlerts: Alert[] = [];

        for (const threshold of thresholds) {
            let shouldAlert = false;
            let alertMessage = "";

            switch (threshold.thresholdType) {
                case "daily_mortality_count":
                    if (activity.activityType === "mortality") {
                        const mortalityData = activity.data as any;
                        if (
                            mortalityData.count &&
                            mortalityData.count > threshold.thresholdValue
                        ) {
                            shouldAlert = true;
                            alertMessage = `Mortality count (${mortalityData.count}) exceeds threshold (${threshold.thresholdValue})`;
                        }
                    }
                    break;

                case "egg_production_drop":
                    if (activity.activityType === "egg_collection") {
                        // Calculate production drop vs historical average
                        // This would require more complex logic in a real implementation
                        const eggData = activity.data as any;
                        // Placeholder logic
                        if (eggData.quantity < 100) {
                            // Example threshold
                            shouldAlert = true;
                            alertMessage = `Low egg production detected (${eggData.quantity} eggs)`;
                        }
                    }
                    break;

                // Add more threshold checks as needed
            }

            if (shouldAlert) {
                const alert = await this.createAlert({
                    type: "threshold_exceeded",
                    severity: threshold.alertLevel,
                    title: `${threshold.thresholdType
                        .replace("_", " ")
                        .toUpperCase()} Alert`,
                    message: alertMessage,
                    activityId: activity.id,
                    userId: activity.userId,
                    farmSection: activity.farmSection,
                });
                triggeredAlerts.push(alert);
            }
        }

        return triggeredAlerts;
    }

    async createInventoryAdjustment(data: {
        itemId: string;
        adjustmentType: string;
        quantity: number;
        reason?: string;
    }) {
        // Fetch item
        const [item] = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.id, data.itemId));
        if (!item) throw new Error("Inventory item not found");

        const delta =
            data.adjustmentType === "restock" ? data.quantity : -data.quantity;
        const newStock = parseFloat(item.currentStock as any) + delta;
        if (newStock < 0) throw new Error("Resulting stock would be negative");

        // Update item stock
        await db
            .update(inventoryItems)
            .set({
                currentStock: newStock.toString(),
                updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, data.itemId));

        // Record adjustment
        const [adj] = await db
            .insert(inventoryAdjustments)
            .values({
                itemId: data.itemId,
                adjustmentType: data.adjustmentType,
                quantity: data.quantity.toString(),
                reason: data.reason,
            })
            .returning();
        return adj;
    }

    async getInventoryAdjustments(itemId: string) {
        return await db
            .select()
            .from(inventoryAdjustments)
            .where(eq(inventoryAdjustments.itemId, itemId))
            .orderBy(desc(inventoryAdjustments.createdAt));
    }

    // Permissions
    async listPermissions() {
        return await db.select().from(permissions).orderBy(permissions.code);
    }
    async createPermission(p: InsertPermission) {
        const [perm] = await db.insert(permissions).values(p).returning();
        return perm;
    }
    async assignPermissionToUser(userId: string, code: string) {
        await db
            .insert(userPermissions)
            .values({ userId, permissionCode: code })
            .onConflictDoNothing();
    }
    async revokePermissionFromUser(userId: string, code: string) {
        await db
            .delete(userPermissions)
            .where(
                and(
                    eq(userPermissions.userId, userId),
                    eq(userPermissions.permissionCode, code)
                )
            );
    }
    async getUserPermissions(userId: string) {
        const rows = await db
            .select({ code: userPermissions.permissionCode })
            .from(userPermissions)
            .where(eq(userPermissions.userId, userId));
        return rows.map((r) => r.code);
    }
    async userHasPermission(userId: string, code: string) {
        const rows = await db
            .select({ code: userPermissions.permissionCode })
            .from(userPermissions)
            .where(
                and(
                    eq(userPermissions.userId, userId),
                    eq(userPermissions.permissionCode, code)
                )
            )
            .limit(1);
        return rows.length > 0;
    }
}

export const storage = new DatabaseStorage();
