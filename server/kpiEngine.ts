import { db } from "./db";
import { sql } from "drizzle-orm";
import {
    dailyActivities,
    dailyKpiSummary,
    kpiTrends,
    financialTransactions,
    alerts,
} from "@shared/schema";
import { eq, gte, lte, and, desc, isNull } from "drizzle-orm";
import type { KpiMetric } from "@shared/types/dashboard.js";

/**
 * KPI Calculation Engine for Poultry Farm Management System
 *
 * Financial Context: All monetary values are calculated and stored in Nigerian Naira (₦)
 * This includes revenue, expenses, feed costs, and all financial KPIs.
 */
export class KpiCalculationEngine {
    async calculateDailyKpis(date: Date, farmSection?: string): Promise<void> {
        const dateStr = date.toISOString().split("T")[0];

        try {
            const [productionData, financialData, operationalData] =
                await Promise.all([
                    this.getProductionData(date, farmSection),
                    this.getFinancialData(date, farmSection),
                    this.getOperationalData(date, farmSection),
                ]);

            const kpis = {
                date: dateStr,
                farmSection: farmSection || null,

                totalEggProduction: productionData.totalEggs,
                eggProductionRate: productionData.productionRate.toString(),
                feedConversionRatio:
                    productionData.feedConversionRatio.toString(),
                averageEggWeight: productionData.averageEggWeight.toString(),
                qualityGradeAPercent:
                    productionData.qualityGradeAPercent.toString(),

                dailyRevenue: financialData.revenue.toString(), // Amount in Naira (₦)
                dailyExpenses: financialData.expenses.toString(), // Amount in Naira (₦)
                profitMargin: financialData.profitMargin.toString(),
                feedCostPerEgg: financialData.feedCostPerEgg.toString(), // Cost per egg in Naira (₦)

                mortalityRate: operationalData.mortalityRate.toString(),
                mortalityCount: operationalData.mortalityCount,
                activeAlertsCount: operationalData.activeAlertsCount,
                criticalAlertsCount: operationalData.criticalAlertsCount,

                eggCollectionEfficiency:
                    productionData.collectionEfficiency.toString(),
                feedUtilizationRate:
                    productionData.feedUtilizationRate.toString(),
                laborProductivity: operationalData.laborProductivity.toString(),

                calculatedAt: new Date(),
            };

            await db
                .delete(dailyKpiSummary)
                .where(
                    farmSection
                        ? and(
                              eq(dailyKpiSummary.date, dateStr),
                              eq(dailyKpiSummary.farmSection, farmSection)
                          )
                        : and(
                              eq(dailyKpiSummary.date, dateStr),
                              isNull(dailyKpiSummary.farmSection)
                          )
                );

            // Insert new KPI record
            await db.insert(dailyKpiSummary).values(kpis);

            console.log(
                `Daily KPIs calculated for ${dateStr}${
                    farmSection ? ` - ${farmSection}` : ""
                }`
            );
        } catch (error) {
            console.error("Error calculating daily KPIs:", error);
            throw error;
        }
    }

    private async getProductionData(date: Date, farmSection?: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const whereClause = farmSection
            ? and(
                  gte(dailyActivities.createdAt, startOfDay),
                  lte(dailyActivities.createdAt, endOfDay),
                  eq(dailyActivities.farmSection, farmSection)
              )
            : and(
                  gte(dailyActivities.createdAt, startOfDay),
                  lte(dailyActivities.createdAt, endOfDay)
              );

        // Get egg collection activities from data field
        const eggActivities = await db
            .select({
                data: dailyActivities.data,
                createdAt: dailyActivities.createdAt,
            })
            .from(dailyActivities)
            .where(
                and(
                    whereClause,
                    eq(dailyActivities.activityType, "egg_collection")
                )
            );

        // Get feed consumption activities from data field
        const feedActivities = await db
            .select({
                data: dailyActivities.data,
            })
            .from(dailyActivities)
            .where(
                and(
                    whereClause,
                    eq(dailyActivities.activityType, "feed_distribution")
                )
            );

        // Calculate metrics from jsonb data
        const totalEggs = eggActivities.reduce((sum, activity) => {
            const data = activity.data as any;
            return sum + (data?.quantity || 0);
        }, 0);

        const totalFeed = feedActivities.reduce((sum, activity) => {
            const data = activity.data as any;
            return sum + parseFloat(data?.amount?.toString() || "0");
        }, 0);

        const gradeAEggs = eggActivities
            .filter((activity) => {
                const data = activity.data as any;
                return data?.qualityGrade === "A";
            })
            .reduce((sum, activity) => {
                const data = activity.data as any;
                return sum + (data?.quantity || 0);
            }, 0);

        const totalWeight = eggActivities.reduce((sum, activity) => {
            const data = activity.data as any;
            return sum + parseFloat(data?.weight?.toString() || "0");
        }, 0);

        const totalCollectors = eggActivities.reduce((sum, activity) => {
            const data = activity.data as any;
            return sum + (data?.collectorCount || 0);
        }, 0);

        const collectionHours = eggActivities.length; // Simplified calculation

        return {
            totalEggs,
            productionRate: totalEggs > 0 ? (totalEggs / 1000) * 100 : 0, // Assuming 1000 birds
            feedConversionRatio: totalEggs > 0 ? totalFeed / totalEggs : 0,
            averageEggWeight: totalEggs > 0 ? totalWeight / totalEggs : 0,
            qualityGradeAPercent:
                totalEggs > 0 ? (gradeAEggs / totalEggs) * 100 : 0,
            collectionEfficiency:
                collectionHours > 0 && totalCollectors > 0
                    ? totalEggs / (totalCollectors * collectionHours)
                    : 0,
            feedUtilizationRate:
                totalFeed > 0 ? ((totalEggs * 0.06) / totalFeed) * 100 : 0, // 60g average egg
        };
    }

    // Get financial data for KPI calculations
    // Note: All financial amounts are stored in Nigerian Naira (₦)
    private async getFinancialData(date: Date, farmSection?: string) {
        const dateStr = date.toISOString().split("T")[0];

        // Get revenue from egg sales (amounts in Naira)
        const revenueTransactions = await db
            .select({
                amount: financialTransactions.amount,
            })
            .from(financialTransactions)
            .where(
                and(
                    eq(financialTransactions.transactionDate, dateStr),
                    eq(financialTransactions.type, "revenue")
                )
            );

        const expenseTransactions = await db
            .select({
                amount: financialTransactions.amount,
                category: financialTransactions.category,
            })
            .from(financialTransactions)
            .where(
                and(
                    eq(financialTransactions.transactionDate, dateStr),
                    eq(financialTransactions.type, "expense")
                )
            );

        const revenue = revenueTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
        );

        const expenses = expenseTransactions.reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
        );

        const feedExpenses = expenseTransactions
            .filter((t) => t.category === "feed")
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        const productionData = await this.getProductionData(date, farmSection);

        return {
            revenue, // Amount in Naira (₦)
            expenses, // Amount in Naira (₦)
            profitMargin:
                revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
            // Cost per egg in Naira (₦)
            feedCostPerEgg:
                productionData.totalEggs > 0
                    ? feedExpenses / productionData.totalEggs
                    : 0,
        };
    }

    private async getOperationalData(date: Date, farmSection?: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const whereClause = farmSection
            ? and(
                  gte(dailyActivities.createdAt, startOfDay),
                  lte(dailyActivities.createdAt, endOfDay),
                  eq(dailyActivities.farmSection, farmSection)
              )
            : and(
                  gte(dailyActivities.createdAt, startOfDay),
                  lte(dailyActivities.createdAt, endOfDay)
              );

        const mortalityActivities = await db
            .select({
                data: dailyActivities.data,
            })
            .from(dailyActivities)
            .where(
                and(whereClause, eq(dailyActivities.activityType, "mortality"))
            );

        const mortalityCount = mortalityActivities.reduce((sum, activity) => {
            const data = activity.data as any;
            return sum + (data?.count || 0);
        }, 0);

        const alertsData = await db
            .select({
                severity: alerts.severity,
            })
            .from(alerts)
            .where(
                and(
                    gte(alerts.createdAt, startOfDay),
                    lte(alerts.createdAt, endOfDay),
                    eq(alerts.isRead, false)
                )
            );

        const activeAlertsCount = alertsData.length;
        const criticalAlertsCount = alertsData.filter(
            (a) => a.severity === "critical"
        ).length;

        const laborProductivity = 1000;

        return {
            mortalityCount,
            mortalityRate: (mortalityCount / 1000) * 100, // Assuming 1000 birds
            activeAlertsCount,
            criticalAlertsCount,
            laborProductivity,
        };
    }

    async calculateKpiTrends(
        kpiName: string,
        category: string,
        period: "day" | "week" | "month" = "day"
    ): Promise<void> {
        try {
            const periodStart = new Date();
            const periodEnd = new Date();

            switch (period) {
                case "week":
                    periodStart.setDate(periodStart.getDate() - 7);
                    break;
                case "month":
                    periodStart.setMonth(periodStart.getMonth() - 1);
                    break;
                default:
                    periodStart.setDate(periodStart.getDate() - 1);
            }

            const [currentPeriod, previousPeriod] = await Promise.all([
                this.getKpiValue(kpiName, periodEnd, periodEnd),
                this.getKpiValue(kpiName, periodStart, periodStart),
            ]);

            if (currentPeriod !== null) {
                const percentageChange =
                    previousPeriod !== null
                        ? ((currentPeriod - previousPeriod) / previousPeriod) *
                          100
                        : null;

                const trend =
                    percentageChange === null
                        ? "stable"
                        : percentageChange > 2
                        ? "up"
                        : percentageChange < -2
                        ? "down"
                        : "stable";

                await db.insert(kpiTrends).values({
                    kpiCategory: category as any,
                    kpiName,
                    currentValue: currentPeriod.toString(),
                    previousValue: previousPeriod?.toString(),
                    percentageChange: percentageChange?.toString(),
                    trend,
                    periodStart,
                    periodEnd,
                });
            }
        } catch (error) {
            console.error(
                `Error calculating KPI trends for ${kpiName}:`,
                error
            );
            throw error;
        }
    }

    private async getKpiValue(
        kpiName: string,
        startDate: Date,
        endDate: Date
    ): Promise<number | null> {
        const results = await db
            .select()
            .from(dailyKpiSummary)
            .where(
                and(
                    gte(
                        dailyKpiSummary.date,
                        startDate.toISOString().split("T")[0]
                    ),
                    lte(
                        dailyKpiSummary.date,
                        endDate.toISOString().split("T")[0]
                    )
                )
            );

        if (results.length === 0) return null;

        // Map KPI name to database field and calculate average
        const values = results.map((row) => {
            switch (kpiName) {
                case "egg_production_rate":
                    return parseFloat(row.eggProductionRate?.toString() || "0");
                case "mortality_rate":
                    return parseFloat(row.mortalityRate?.toString() || "0");
                case "feed_conversion_ratio":
                    return parseFloat(
                        row.feedConversionRatio?.toString() || "0"
                    );
                case "profit_margin":
                    return parseFloat(row.profitMargin?.toString() || "0");
                default:
                    return 0;
            }
        });

        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Get comprehensive dashboard data
    async getDashboardData(userId: string, filters?: any): Promise<any> {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Last 30 days

            // Get latest KPI summary
            const latestKpis = await db
                .select()
                .from(dailyKpiSummary)
                .orderBy(desc(dailyKpiSummary.date))
                .limit(1);

            if (latestKpis.length === 0) {
                // If no KPIs exist, calculate them for yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                await this.calculateDailyKpis(yesterday);

                // Try again
                return this.getDashboardData(userId, filters);
            }

            const kpiData = latestKpis[0];

            // Get trends
            const trends = await db
                .select()
                .from(kpiTrends)
                .where(gte(kpiTrends.periodEnd, startDate))
                .orderBy(desc(kpiTrends.periodEnd));

            // Get recent alerts
            const recentAlerts = await db
                .select()
                .from(alerts)
                .where(gte(alerts.createdAt, startDate))
                .orderBy(desc(alerts.createdAt))
                .limit(10);

            return {
                summary: {
                    totalRevenue: parseFloat(
                        kpiData.dailyRevenue?.toString() || "0"
                    ), // Amount in Naira (₦)
                    totalExpenses: parseFloat(
                        kpiData.dailyExpenses?.toString() || "0"
                    ), // Amount in Naira (₦)
                    profitMargin: parseFloat(
                        kpiData.profitMargin?.toString() || "0"
                    ),
                    eggProduction: kpiData.totalEggProduction || 0,
                    mortalityRate: parseFloat(
                        kpiData.mortalityRate?.toString() || "0"
                    ),
                    feedConversionRatio: parseFloat(
                        kpiData.feedConversionRatio?.toString() || "0"
                    ),
                    alertsCount: {
                        total: kpiData.activeAlertsCount || 0,
                        critical: kpiData.criticalAlertsCount || 0,
                        high: 0,
                        medium: 0,
                        low: 0,
                    },
                },
                kpis: this.formatKpis(kpiData),
                trends: this.formatTrends(trends),
                recentAlerts: this.formatAlerts(recentAlerts),
                lastUpdated: kpiData.calculatedAt || new Date(),
            };
        } catch (error) {
            console.error("Error getting dashboard data:", error);
            throw error;
        }
    }

    // Format KPIs for dashboard display
    private formatKpis(kpiData: any): KpiMetric[] {
        return [
            {
                id: "egg_production",
                name: "Daily Egg Production",
                category: "production",
                currentValue: kpiData.totalEggProduction || 0,
                trend: "stable",
                unit: "eggs",
                status: "good",
                lastUpdated: kpiData.calculatedAt || new Date(),
            },
            {
                id: "mortality_rate",
                name: "Mortality Rate",
                category: "operational",
                currentValue: parseFloat(
                    kpiData.mortalityRate?.toString() || "0"
                ),
                trend: "stable",
                unit: "%",
                status:
                    parseFloat(kpiData.mortalityRate?.toString() || "0") > 2
                        ? "critical"
                        : "good",
                lastUpdated: kpiData.calculatedAt || new Date(),
            },
            {
                id: "profit_margin",
                name: "Profit Margin",
                category: "financial",
                currentValue: parseFloat(
                    kpiData.profitMargin?.toString() || "0"
                ),
                trend: "stable",
                unit: "%",
                status: "good",
                lastUpdated: kpiData.calculatedAt || new Date(),
            },
        ];
    }

    private formatTrends(trends: any[]) {
        return {
            production: [],
            financial: [],
            operational: [],
        };
    }

    private formatAlerts(alerts: any[]) {
        return alerts.map((alert) => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            farmSection: alert.farmSection,
            createdAt: alert.createdAt,
            isRead: alert.isRead,
            actionRequired: alert.severity === "critical",
        }));
    }

    /**
     * Aggregate intra-day metrics into kpi_hourly table from recent activities.
     * Simplified: aggregates last hour window.
     */
    async aggregateHourlyMetrics(reference: Date = new Date()): Promise<void> {
        // Placeholder – actual implementation will query dailyActivities -> feed_distribution, egg_collection, mortality
        try {
            // Implementation to be added Phase 2 Day 3-4
        } catch (e) {
            console.error("aggregateHourlyMetrics error", e);
        }
    }

    /**
     * Roll up production_metrics (section granularity) into kpi_daily (single row per day) then refresh MV.
     */
    async aggregateDailyRollup(date: Date = new Date()): Promise<void> {
        try {
            // Placeholder – will read production_metrics + financial + mortality to populate kpi_daily
        } catch (e) {
            console.error("aggregateDailyRollup error", e);
        }
    }

    /** Refresh materialized view mv_kpi_dashboard (non-concurrent fallback). */
    async refreshDashboardView(): Promise<void> {
        try {
            await db.execute(sql`REFRESH MATERIALIZED VIEW mv_kpi_dashboard`);
        } catch (e: any) {
            console.error("refreshDashboardView error", e);
        }
    }

    /** Lightweight summary for executive dashboard (bridge until new tables populated). */
    async getExecutiveSummary(): Promise<any> {
        // For now reuse existing getDashboardData summary structure
        const base = await this.getDashboardData("system");
        return {
            date: new Date().toISOString().split("T")[0],
            revenue: base.summary.totalRevenue,
            expenses: base.summary.totalExpenses,
            profitMargin: base.summary.profitMargin,
            eggs: base.summary.eggProduction,
            mortalityRate: base.summary.mortalityRate,
            fcr: base.summary.feedConversionRatio,
            alerts: base.summary.alertsCount,
            lastUpdated: base.lastUpdated,
        };
    }
}

export const kpiEngine = new KpiCalculationEngine();
