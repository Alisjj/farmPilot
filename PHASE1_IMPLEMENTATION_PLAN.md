# Phase 1 Implementation Plan: Enhanced Daily Activity Recording

## 🎯 **Phase 1 Overview**

**Duration:** 2 weeks  
**Priority:** HIGH  
**Goal:** Transform basic activity logging into comprehensive farm operations tracking with structured data capture, automated calculations, and intelligent alerts.

---

## 📋 **Implementation Tasks**

### **Week 1: Database & Backend Enhancement**

#### **Day 1-2: Database Schema Updates**

**Task 1.1: Enhance Daily Activities Schema**

```sql
-- Add new columns to daily_activities table
ALTER TABLE daily_activities
ADD COLUMN farm_section VARCHAR(100),
ADD COLUMN weather_temperature DECIMAL(5,2),
ADD COLUMN weather_humidity DECIMAL(5,2),
ADD COLUMN weather_conditions VARCHAR(100),
ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN priority VARCHAR(10) DEFAULT 'normal',
ADD COLUMN due_date TIMESTAMP,
ADD COLUMN completed_at TIMESTAMP,
ADD COLUMN reviewer_id VARCHAR REFERENCES users(id),
ADD COLUMN review_notes TEXT;
```

**Task 1.2: Create Activity-Specific Data Structures**

```typescript
// Enhanced data structures for each activity type
interface EggCollectionData {
    quantity: number;
    qualityGrade: "A" | "B" | "C" | "Cracked";
    coopLocation: string;
    collectionTime: string;
    collectorsCount: number;
    eggsPerHour: number;
}

interface FeedDistributionData {
    feedType: string;
    quantityKg: number;
    feedingTime: string;
    distributionMethod: "automatic" | "manual";
    feedQuality: "excellent" | "good" | "poor";
    wasteAmount: number;
}

interface MortalityData {
    count: number;
    suspectedCause: "disease" | "injury" | "natural" | "unknown";
    affectedCoop: string;
    symptoms: string[];
    disposalMethod: string;
    vetNotified: boolean;
    photos: string[]; // File URLs
}

interface MedicationData {
    medicationType: string;
    dosage: string;
    administrationMethod: "water" | "feed" | "injection" | "spray";
    treatedBirds: number;
    withdrawalPeriod: number; // days
    reasonForTreatment: string;
    vetPrescription: boolean;
}

interface WaterConsumptionData {
    volumeLiters: number;
    waterSource: string;
    qualityCheck: "passed" | "failed";
    temperature: number;
    consumptionRate: number; // liters per bird
    systemPressure: number;
}

interface EggSalesData {
    quantity: number;
    pricePerDozen: number;
    totalRevenue: number;
    buyer: string;
    qualityGrade: "A" | "B" | "C";
    deliveryMethod: "pickup" | "delivery";
    paymentStatus: "pending" | "paid";
}
```

**Task 1.3: Create Alert Thresholds Table**

```sql
CREATE TABLE alert_thresholds (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    comparison_type VARCHAR(20) NOT NULL, -- 'greater_than', 'less_than', 'equals'
    alert_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    notification_channels JSONB, -- ['email', 'sms', 'dashboard']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO alert_thresholds (threshold_type, threshold_value, comparison_type, alert_level, notification_channels) VALUES
('daily_mortality_count', 5, 'greater_than', 'high', '["dashboard", "email"]'),
('daily_mortality_percentage', 2.0, 'greater_than', 'critical', '["dashboard", "email", "sms"]'),
('egg_production_drop', 20, 'greater_than', 'medium', '["dashboard"]'),
('feed_consumption_increase', 15, 'greater_than', 'medium', '["dashboard"]'),
('water_consumption_drop', 25, 'greater_than', 'high', '["dashboard", "email"]');
```

#### **Day 3-4: Backend API Enhancement**

**Task 1.4: Enhanced Storage Methods**

```typescript
// Add to storage.ts
export interface ActivityWithMetrics extends DailyActivity {
  metrics?: {
    efficiency: number;
    deviation: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// Enhanced methods
async createDailyActivityWithValidation(
  activity: InsertDailyActivity & { farmSection: string }
): Promise<DailyActivity>;

async getActivitiesWithMetrics(
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    activityType?: string;
    farmSection?: string;
    status?: string;
    userId?: string;
  }
): Promise<ActivityWithMetrics[]>;

async checkAlertThresholds(
  activity: DailyActivity
): Promise<{ alerts: Alert[]; severity: string }>;

async getActivitySummary(
  dateFrom: Date,
  dateTo: Date
): Promise<{
  totalActivities: number;
  byType: Record<string, number>;
  alerts: number;
  completionRate: number;
}>;
```

**Task 1.5: Alert System Implementation**

```typescript
// Create alerts.ts
export interface Alert {
    id: string;
    type: "threshold_exceeded" | "deadline_missed" | "quality_concern";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    message: string;
    activityId: string;
    userId: string;
    farmSection: string;
    isRead: boolean;
    createdAt: Date;
    expiresAt?: Date;
}

export class AlertSystem {
    static async checkMortalityThreshold(
        mortalityData: MortalityData,
        farmSection: string
    ): Promise<Alert[]>;
    static async checkProductionDrop(
        eggData: EggCollectionData,
        historical: EggCollectionData[]
    ): Promise<Alert[]>;
    static async checkFeedConsumption(
        feedData: FeedDistributionData,
        baseline: number
    ): Promise<Alert[]>;
    static async notifyManagement(alerts: Alert[]): Promise<void>;
}
```

#### **Day 5: Weather Integration**

**Task 1.6: Weather API Integration**

```typescript
// Create weatherService.ts
export interface WeatherData {
    temperature: number;
    humidity: number;
    conditions: string;
    windSpeed: number;
    pressure: number;
    timestamp: Date;
}

export class WeatherService {
    static async getCurrentWeather(location: string): Promise<WeatherData>;
    static async getWeatherForecast(
        location: string,
        days: number
    ): Promise<WeatherData[]>;
    static async logWeatherData(
        activityId: string,
        weather: WeatherData
    ): Promise<void>;
}
```

### **Week 2: Frontend Enhancement**

#### **Day 6-7: Activity-Specific Forms**

**Task 2.1: Enhanced Activity Form Components**

```typescript
// Create components/activities/EggCollectionForm.tsx
export interface EggCollectionFormProps {
    onSubmit: (data: EggCollectionData) => void;
    initialData?: Partial<EggCollectionData>;
    coopLocations: string[];
}

// Similar forms for:
// - FeedDistributionForm.tsx
// - MortalityForm.tsx
// - MedicationForm.tsx
// - WaterConsumptionForm.tsx
// - EggSalesForm.tsx
```

**Task 2.2: Smart Form Validation**

```typescript
// Create lib/activityValidation.ts
export const activityValidationSchemas = {
    egg_collection: z.object({
        quantity: z.number().min(0).max(10000),
        qualityGrade: z.enum(["A", "B", "C", "Cracked"]),
        coopLocation: z.string().min(1),
        collectionTime: z.string(),
        collectorsCount: z.number().min(1),
    }),

    mortality: z.object({
        count: z.number().min(0).max(1000),
        suspectedCause: z.enum(["disease", "injury", "natural", "unknown"]),
        affectedCoop: z.string().min(1),
        symptoms: z.array(z.string()),
        disposalMethod: z.string().min(1),
        vetNotified: z.boolean(),
    }),

    // ... other activity types
};
```

#### **Day 8-9: Dashboard Enhancements**

**Task 2.3: Activity Metrics Dashboard**

```typescript
// Create components/dashboard/ActivityMetrics.tsx
export function ActivityMetrics() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="Today's Egg Collection"
                value={todayEggs}
                trend={eggTrend}
                target={dailyTarget}
            />
            <MetricCard
                title="Mortality Rate"
                value={mortalityRate}
                trend={mortalityTrend}
                alert={mortalityAlert}
            />
            <MetricCard
                title="Feed Efficiency"
                value={feedEfficiency}
                trend={feedTrend}
            />
            <MetricCard
                title="Tasks Completion"
                value={completionRate}
                trend={completionTrend}
            />
        </div>
    );
}
```

**Task 2.4: Alert Management System**

```typescript
// Create components/alerts/AlertCenter.tsx
export function AlertCenter() {
    const { data: alerts } = useQuery({
        queryKey: ["/api/alerts"],
        queryFn: () => apiRequest("/api/alerts"),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Active Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts?.map((alert) => (
                    <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismissAlert}
                        onView={handleViewAlert}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
```

#### **Day 10: Advanced Filtering & Search**

**Task 2.5: Enhanced Activity List**

```typescript
// Update components/activities/ActivityList.tsx
export function ActivityList() {
    const [filters, setFilters] = useState({
        dateFrom: null,
        dateTo: null,
        activityType: "all",
        farmSection: "all",
        status: "all",
        priority: "all",
        alertsOnly: false,
    });

    return (
        <div>
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
            <ExportPanel onExport={handleExport} />
            <ActivityTable activities={filteredActivities} />
            <Pagination />
        </div>
    );
}
```

---

## 🗂️ **File Structure Changes**

### **New Files to Create:**

```
client/src/
├── components/
│   ├── activities/
│   │   ├── EggCollectionForm.tsx
│   │   ├── FeedDistributionForm.tsx
│   │   ├── MortalityForm.tsx
│   │   ├── MedicationForm.tsx
│   │   ├── WaterConsumptionForm.tsx
│   │   ├── EggSalesForm.tsx
│   │   ├── ActivityMetrics.tsx
│   │   └── FilterPanel.tsx
│   ├── alerts/
│   │   ├── AlertCenter.tsx
│   │   ├── AlertItem.tsx
│   │   └── AlertBadge.tsx
│   └── dashboard/
│       ├── MetricCard.tsx
│       └── TrendChart.tsx
├── lib/
│   ├── activityValidation.ts
│   ├── alertUtils.ts
│   └── metricsCalculator.ts
└── types/
    └── activities.ts

server/
├── services/
│   ├── weatherService.ts
│   ├── alertService.ts
│   └── metricsService.ts
└── utils/
    └── thresholdChecker.ts

shared/
└── types/
    ├── activities.ts
    ├── alerts.ts
    └── weather.ts
```

### **Files to Modify:**

-   `shared/schema.ts` - Add new columns and tables
-   `server/storage.ts` - Add enhanced methods
-   `server/routes.ts` - Add new endpoints
-   `client/src/pages/activities.tsx` - Integrate new forms
-   `client/src/pages/dashboard.tsx` - Add metrics

---

## 🔧 **Technical Implementation Details**

### **Database Migration Script:**

```sql
-- migration_001_enhanced_activities.sql
BEGIN;

-- Add new columns to daily_activities
ALTER TABLE daily_activities
ADD COLUMN farm_section VARCHAR(100),
ADD COLUMN weather_temperature DECIMAL(5,2),
ADD COLUMN weather_humidity DECIMAL(5,2),
ADD COLUMN status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN priority VARCHAR(10) DEFAULT 'normal',
ADD COLUMN due_date TIMESTAMP,
ADD COLUMN completed_at TIMESTAMP,
ADD COLUMN reviewer_id VARCHAR REFERENCES users(id);

-- Create alert_thresholds table
CREATE TABLE alert_thresholds (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    comparison_type VARCHAR(20) NOT NULL,
    alert_level VARCHAR(20) NOT NULL,
    notification_channels JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    activity_id VARCHAR REFERENCES daily_activities(id),
    user_id VARCHAR REFERENCES users(id),
    farm_section VARCHAR(100),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Insert default thresholds
INSERT INTO alert_thresholds (threshold_type, threshold_value, comparison_type, alert_level, notification_channels) VALUES
('daily_mortality_count', 5, 'greater_than', 'high', '["dashboard", "email"]'),
('daily_mortality_percentage', 2.0, 'greater_than', 'critical', '["dashboard", "email"]'),
('egg_production_drop', 20, 'greater_than', 'medium', '["dashboard"]');

COMMIT;
```

### **API Endpoints to Add:**

```typescript
// New routes in server/routes.ts
GET    /api/activities/metrics      // Activity metrics and summaries
GET    /api/activities/export       // Export filtered activities
POST   /api/activities/validate     // Validate activity data
GET    /api/alerts                  // Get user alerts
POST   /api/alerts/dismiss          // Dismiss alerts
GET    /api/weather/current         // Current weather data
GET    /api/thresholds             // Alert thresholds
PUT    /api/thresholds/:id         // Update thresholds
```

---

## ✅ **Success Criteria**

### **Week 1 Completion:**

-   [ ] Database schema updated with new columns
-   [ ] Alert thresholds table created and populated
-   [ ] Enhanced storage methods implemented
-   [ ] Alert system backend completed
-   [ ] Weather service integration working

### **Week 2 Completion:**

-   [ ] Activity-specific forms created and functional
-   [ ] Validation schemas implemented
-   [ ] Dashboard metrics displaying correctly
-   [ ] Alert center showing real-time alerts
-   [ ] Advanced filtering working
-   [ ] Export functionality operational

### **End-to-End Tests:**

-   [ ] Create egg collection record with automatic calculations
-   [ ] Mortality entry triggers alert when exceeding threshold
-   [ ] Weather data automatically captured
-   [ ] Management receives alert notifications
-   [ ] Filter activities by date range and type
-   [ ] Export filtered results to CSV

---

## 🚀 **Next Steps After Phase 1**

1. **User Testing:** Deploy to staging for supervisor testing
2. **Performance Optimization:** Optimize database queries for large datasets
3. **Mobile Responsiveness:** Ensure forms work well on mobile devices
4. **Documentation:** Create user guides for new features
5. **Phase 2 Preparation:** Begin inventory management system design

---

## 📊 **Expected Outcomes**

-   **Data Quality:** 90% improvement in structured data capture
-   **Alert Response:** 70% reduction in missed critical events
-   **Efficiency:** 50% reduction in time spent on activity logging
-   **Accuracy:** 80% improvement in farm operation tracking
-   **User Satisfaction:** Streamlined workflow for supervisors and managers

This implementation plan transforms the basic activity logging into a comprehensive farm operations management system that meets the detailed requirements for daily farm activity recording and monitoring.
