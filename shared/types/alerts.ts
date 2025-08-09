// Alert system types for farm operations monitoring

export interface AlertData {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    activityId?: string;
    userId: string;
    farmSection?: string;
    isRead: boolean;
    createdAt: Date;
    expiresAt?: Date;
    metadata?: Record<string, any>; // Additional alert context
}

export const ALERT_TYPES = {
    threshold_exceeded: "Threshold Exceeded",
    deadline_missed: "Deadline Missed",
    quality_concern: "Quality Concern",
    equipment_failure: "Equipment Failure",
    inventory_low: "Low Inventory",
    health_concern: "Health Concern",
    weather_alert: "Weather Alert",
    system_alert: "System Alert",
} as const;

export type AlertType = keyof typeof ALERT_TYPES;

export const ALERT_SEVERITY = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
} as const;

export type AlertSeverity = keyof typeof ALERT_SEVERITY;

export const NOTIFICATION_CHANNELS = {
    dashboard: "Dashboard",
    email: "Email",
    sms: "SMS",
    push: "Push Notification",
} as const;

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS;

export interface ThresholdData {
    id: string;
    thresholdType: ThresholdType;
    thresholdValue: number;
    comparisonType: ComparisonType;
    alertLevel: AlertSeverity;
    notificationChannels: NotificationChannel[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const THRESHOLD_TYPES = {
    daily_mortality_count: "Daily Mortality Count",
    daily_mortality_percentage: "Daily Mortality Percentage",
    egg_production_drop: "Egg Production Drop (%)",
    feed_consumption_increase: "Feed Consumption Increase (%)",
    water_consumption_drop: "Water Consumption Drop (%)",
    egg_quality_decline: "Egg Quality Decline (%)",
    task_overdue: "Tasks Overdue (hours)",
    temperature_extreme: "Extreme Temperature",
    humidity_extreme: "Extreme Humidity",
} as const;

export type ThresholdType = keyof typeof THRESHOLD_TYPES;

export const COMPARISON_TYPES = {
    greater_than: "Greater Than",
    less_than: "Less Than",
    equals: "Equals",
    not_equals: "Not Equals",
    between: "Between",
} as const;

export type ComparisonType = keyof typeof COMPARISON_TYPES;

// Default threshold configurations
export const DEFAULT_THRESHOLDS: Omit<
    ThresholdData,
    "id" | "createdAt" | "updatedAt"
>[] = [
    {
        thresholdType: "daily_mortality_count",
        thresholdValue: 5,
        comparisonType: "greater_than",
        alertLevel: "high",
        notificationChannels: ["dashboard", "email"],
        isActive: true,
    },
    {
        thresholdType: "daily_mortality_percentage",
        thresholdValue: 2.0,
        comparisonType: "greater_than",
        alertLevel: "critical",
        notificationChannels: ["dashboard", "email", "sms"],
        isActive: true,
    },
    {
        thresholdType: "egg_production_drop",
        thresholdValue: 20,
        comparisonType: "greater_than",
        alertLevel: "medium",
        notificationChannels: ["dashboard"],
        isActive: true,
    },
    {
        thresholdType: "feed_consumption_increase",
        thresholdValue: 15,
        comparisonType: "greater_than",
        alertLevel: "medium",
        notificationChannels: ["dashboard"],
        isActive: true,
    },
    {
        thresholdType: "water_consumption_drop",
        thresholdValue: 25,
        comparisonType: "greater_than",
        alertLevel: "high",
        notificationChannels: ["dashboard", "email"],
        isActive: true,
    },
];

// Alert creation helpers
export interface CreateAlertParams {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    activityId?: string;
    userId: string;
    farmSection?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}

// Alert filtering and sorting
export interface AlertFilters {
    type?: AlertType;
    severity?: AlertSeverity;
    isRead?: boolean;
    farmSection?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface AlertSortOptions {
    field: "createdAt" | "severity" | "type";
    direction: "asc" | "desc";
}

// Alert statistics
export interface AlertStats {
    total: number;
    unread: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
    recent: AlertData[]; // Last 5 alerts
}
