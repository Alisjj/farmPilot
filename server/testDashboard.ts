// Test script to populate sample data and test Phase 2 Dashboard
import { db } from "./db.js";
import { dailyActivities, financialTransactions } from "@shared/schema.js";
import { kpiEngine } from "./kpiEngine.js";

async function populateSampleData() {
    console.log("🌱 Populating sample farm data...");

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    try {
        // Sample egg collection activities
        await db.insert(dailyActivities).values([
            {
                userId: "test-user",
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
                userId: "test-user",
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
                userId: "test-user",
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
                userId: "test-user",
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
                createdBy: "test-user",
            },
            {
                type: "expense",
                category: "feed",
                amount: "185.75",
                description: "Layer mash purchase",
                transactionDate: dateStr,
                createdBy: "test-user",
            },
            {
                type: "expense",
                category: "labor",
                amount: "120.00",
                description: "Daily labor costs",
                transactionDate: dateStr,
                createdBy: "test-user",
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
        const dashboardData = await kpiEngine.getDashboardData("test-user");

        console.log("🎯 Dashboard Summary:");
        console.log(`  Total Revenue: $${dashboardData.summary.totalRevenue}`);
        console.log(
            `  Total Expenses: $${dashboardData.summary.totalExpenses}`
        );
        console.log(
            `  Profit Margin: ${dashboardData.summary.profitMargin.toFixed(2)}%`
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

        console.log("\n📊 KPI Details:");
        dashboardData.kpis.forEach(
            (kpi: { name: any; currentValue: any; unit: any; status: any }) => {
                console.log(
                    `  ${kpi.name}: ${kpi.currentValue} ${kpi.unit} (${kpi.status})`
                );
            }
        );

        console.log("\n🎉 Phase 2 Dashboard test completed successfully!");
    } catch (error) {
        console.error("❌ Error in test:", error);
        throw error;
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    populateSampleData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Test failed:", error);
            process.exit(1);
        });
}
