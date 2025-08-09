// Dashboard and Analytics Types for Phase 2

// KPI Data Structure
export interface KpiMetric {
    id: string;
    name: string;
    category:
        | "production"
        | "financial"
        | "operational"
        | "quality"
        | "efficiency";
    currentValue: number;
    previousValue?: number;
    percentageChange?: number;
    trend: "up" | "down" | "stable";
    unit: string;
    target?: number;
    status: "good" | "warning" | "critical";
    lastUpdated: Date;
}

// Dashboard Widget Configuration
export interface DashboardWidget {
    id: string;
    type: "kpi-card" | "chart" | "table" | "alert-summary" | "metric-grid";
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        kpiNames?: string[];
        chartType?: "line" | "bar" | "pie" | "area";
        timeRange?: "7d" | "30d" | "90d" | "1y";
        farmSections?: string[];
        refreshInterval?: number;
    };
    isVisible: boolean;
}

// Executive Dashboard Data
export interface ExecutiveDashboardData {
    summary: {
        totalRevenue: number;
        totalExpenses: number;
        profitMargin: number;
        eggProduction: number;
        mortalityRate: number;
        feedConversionRatio: number;
        alertsCount: {
            total: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    };
    kpis: KpiMetric[];
    trends: {
        production: ChartDataPoint[];
        financial: ChartDataPoint[];
        operational: ChartDataPoint[];
    };
    recentAlerts: AlertSummary[];
    lastUpdated: Date;
}

// Chart Data Structure
export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
    category?: string;
}

export interface ChartConfig {
    type: "line" | "bar" | "pie" | "area" | "scatter";
    title: string;
    data: ChartDataPoint[];
    xAxis: {
        label: string;
        format?: "date" | "number" | "string";
    };
    yAxis: {
        label: string;
        format?: "currency" | "percentage" | "number";
        min?: number;
        max?: number;
    };
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
}

// Alert Summary for Dashboard
export interface AlertSummary {
    id: string;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    farmSection?: string;
    createdAt: Date;
    isRead: boolean;
    actionRequired: boolean;
}

// Production Analytics
export interface ProductionAnalytics {
    dailyProduction: {
        eggs: number;
        productionRate: number;
        qualityGradeDistribution: {
            A: number;
            B: number;
            C: number;
            cracked: number;
        };
    };
    feedEfficiency: {
        consumption: number;
        conversionRatio: number;
        costPerEgg: number;
    };
    flockHealth: {
        mortalityCount: number;
        mortalityRate: number;
        activeHealthIssues: number;
    };
    trends: {
        productionTrend: ChartDataPoint[];
        mortalityTrend: ChartDataPoint[];
        feedConsumptionTrend: ChartDataPoint[];
    };
}

// Financial Analytics
export interface FinancialAnalytics {
    revenue: {
        daily: number;
        weekly: number;
        monthly: number;
        yearToDate: number;
    };
    expenses: {
        feed: number;
        labor: number;
        veterinary: number;
        utilities: number;
        other: number;
        total: number;
    };
    profitability: {
        grossProfit: number;
        netProfit: number;
        profitMargin: number;
        revenuePerEgg: number;
        costPerEgg: number;
    };
    trends: {
        revenueTrend: ChartDataPoint[];
        expenseTrend: ChartDataPoint[];
        profitTrend: ChartDataPoint[];
    };
}

// Report Configuration
export interface ReportConfig {
    id?: string;
    name: string;
    description?: string;
    templateType: "executive" | "operational" | "financial" | "custom";
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    isActive: boolean;
    includedKpis: string[];
    filters: {
        dateRange: {
            start: Date;
            end: Date;
        };
        farmSections?: string[];
        categories?: string[];
    };
    format: {
        type: "pdf" | "csv" | "excel";
        includeCharts: boolean;
        includeSummary: boolean;
        pageSize?: "A4" | "letter";
        orientation?: "portrait" | "landscape";
    };
    delivery: {
        recipientEmails: string[];
        subject?: string;
        customMessage?: string;
    };
    schedule: {
        nextRunDate: Date;
        lastRunDate?: Date;
        timezone: string;
    };
}

// Report Generation Status
export interface ReportRun {
    id: string;
    templateId: string;
    templateName: string;
    status: "pending" | "running" | "completed" | "failed";
    startedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    filePath?: string;
    fileSize?: number;
    recordCount?: number;
    emailsSent: number;
    emailsFailed: number;
    deliveryAttempts: number;
}

// Dashboard Filter Options
export interface DashboardFilters {
    dateRange: {
        start: Date;
        end: Date;
        preset?: "7d" | "30d" | "90d" | "1y" | "custom";
    };
    farmSections: string[];
    kpiCategories: string[];
    alertSeverities: string[];
    includeInactive?: boolean;
}

// Analytics Query Parameters
export interface AnalyticsQuery {
    startDate: string;
    endDate: string;
    farmSections?: string[];
    kpiCategory?: string;
    groupBy?: "day" | "week" | "month";
    aggregation?: "sum" | "avg" | "min" | "max" | "count";
    includeComparisons?: boolean;
    includeTrends?: boolean;
}

// Performance Benchmarks
export interface PerformanceBenchmark {
    metric: string;
    currentValue: number;
    targetValue: number;
    industryAverage?: number;
    performance: "excellent" | "good" | "average" | "below-average" | "poor";
    recommendation?: string;
}

// Farm Section Performance
export interface FarmSectionPerformance {
    sectionName: string;
    kpis: {
        eggProduction: number;
        mortalityRate: number;
        feedConversion: number;
        profitability: number;
    };
    ranking: number;
    totalSections: number;
    improvements: string[];
}

// Predictive Analytics
export interface PredictiveInsight {
    type: "trend" | "forecast" | "anomaly" | "recommendation";
    metric: string;
    prediction: {
        value: number;
        confidence: number;
        timeframe: string;
    };
    factors: string[];
    recommendation: string;
    impact: "high" | "medium" | "low";
}

// Export types
export type DashboardData = ExecutiveDashboardData;
export type AnalyticsData = ProductionAnalytics & FinancialAnalytics;

// Constants
export const KPI_CATEGORIES = [
    "production",
    "financial",
    "operational",
    "quality",
    "efficiency",
] as const;

export const CHART_TYPES = ["line", "bar", "pie", "area", "scatter"] as const;

export const REPORT_FREQUENCIES = [
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
] as const;

export const ALERT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
