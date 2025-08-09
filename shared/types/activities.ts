// Activity-specific data structures for enhanced farm operations tracking
// These interfaces define the structured data stored in the dailyActivities.data JSONB field

export interface EggCollectionData {
    quantity: number;
    qualityGrade: "A" | "B" | "C" | "Cracked";
    coopLocation: string;
    collectionTime: string;
    collectorsCount: number;
    eggsPerHour?: number; // Calculated field
    averageWeight?: number; // Optional: average egg weight
    crackedCount?: number; // Number of cracked eggs
    doubleYolkCount?: number; // Number of double yolk eggs
}

export interface FeedDistributionData {
    feedType: string;
    quantityKg: number;
    feedingTime: string;
    distributionMethod: "automatic" | "manual";
    feedQuality: "excellent" | "good" | "poor";
    wasteAmount?: number; // Feed waste in kg
    consumptionRate?: number; // kg per bird
    feedConversionRatio?: number; // Feed efficiency metric
    costPerKg?: number; // Feed cost
}

export interface MortalityData {
    count: number;
    suspectedCause:
        | "disease"
        | "injury"
        | "natural"
        | "unknown"
        | "predator"
        | "environmental";
    affectedCoop: string;
    symptoms: string[];
    disposalMethod: string;
    vetNotified: boolean;
    photos?: string[]; // File URLs for documentation
    ageGroup?: "chicks" | "pullets" | "layers" | "breeders";
    mortalityRate?: number; // Calculated percentage
    trends?: "increasing" | "decreasing" | "stable";
    // Added environmental context
    temperatureC?: number; // Ambient temperature at time of record
    humidityPct?: number; // Relative humidity percentage
    conditions?: "clear" | "cloudy" | "rain" | "storm" | "hot" | "cold"; // Simple categorized conditions
}

export interface MedicationData {
    medicationType: string;
    dosage: string;
    administrationMethod: "water" | "feed" | "injection" | "spray" | "oral";
    treatedBirds: number;
    withdrawalPeriod: number; // days until eggs/meat can be consumed
    reasonForTreatment: string;
    vetPrescription: boolean;
    batchNumber?: string; // Medicine batch tracking
    expirationDate?: string;
    costPerDose?: number;
    treatmentDuration?: number; // days of treatment
}

export interface WaterConsumptionData {
    volumeLiters: number;
    waterSource: string;
    qualityCheck: "passed" | "failed" | "pending";
    temperature?: number;
    consumptionRate?: number; // liters per bird per day
    systemPressure?: number; // water system pressure
    pHLevel?: number;
    chlorineLevel?: number; // water treatment level
    issues?: string[]; // Any water system issues
}

export interface EggSalesData {
    quantity: number;
    pricePerDozen: number;
    totalRevenue: number;
    buyer: string;
    qualityGrade: "A" | "B" | "C";
    deliveryMethod: "pickup" | "delivery";
    paymentStatus: "pending" | "paid" | "overdue";
    invoiceNumber?: string;
    deliveryDate?: string;
    customerContact?: string;
    packagingType?: "cartons" | "trays" | "bulk";
}

export interface CleaningData {
    areasCleaned: string[];
    cleaningType: "daily" | "weekly" | "deep" | "disinfection";
    chemicalsUsed: string[];
    timeSpent: number; // minutes
    staffCount: number;
    equipmentUsed: string[];
    completionStatus: "completed" | "partial" | "pending";
    issues?: string[];
}

export interface MaintenanceData {
    equipmentType: string;
    maintenanceType: "preventive" | "corrective" | "emergency";
    description: string;
    partsReplaced?: string[];
    timeSpent: number; // minutes
    cost?: number;
    nextMaintenanceDate?: string;
    technician: string;
    completionStatus: "completed" | "partial" | "pending";
    photos?: string[]; // Before/after photos
}

// Union type for all activity data
export type ActivityData =
    | EggCollectionData
    | FeedDistributionData
    | MortalityData
    | MedicationData
    | WaterConsumptionData
    | EggSalesData
    | CleaningData
    | MaintenanceData;

// Activity type mapping
export const ACTIVITY_TYPES = {
    egg_collection: "Egg Collection",
    feed_distribution: "Feed Distribution",
    mortality: "Mortality Check",
    medication: "Medication",
    water_consumption: "Water Consumption",
    egg_sales: "Egg Sales",
    cleaning: "Cleaning",
    maintenance: "Maintenance",
} as const;

export type ActivityType = keyof typeof ACTIVITY_TYPES;

// Farm sections/locations
export const FARM_SECTIONS = [
    "Coop A",
    "Coop B",
    "Coop C",
    "Feed Storage",
    "Processing Area",
    "Office",
    "Equipment Shed",
    "Outdoor Run",
    "Quarantine Area",
] as const;

export type FarmSection = (typeof FARM_SECTIONS)[number];

// Activity status types
export const ACTIVITY_STATUS = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
    cancelled: "Cancelled",
} as const;

export type ActivityStatus = keyof typeof ACTIVITY_STATUS;

// Priority levels
export const PRIORITY_LEVELS = {
    low: "Low",
    normal: "Normal",
    high: "High",
    critical: "Critical",
} as const;

export type PriorityLevel = keyof typeof PRIORITY_LEVELS;
