import { storage } from "../../storage";

export async function generateProductionCSV(dateFrom?: Date, dateTo?: Date) {
    // Placeholder: fetch minimal metrics (could expand with real production data)
    const metrics = await storage.getDashboardMetrics();
    const headers = ["date", "eggsCollected", "mortality"];
    const today = new Date();
    const row = [
        today.toISOString().slice(0, 10),
        metrics.eggsCollectedToday ?? 0,
        metrics.mortality ?? 0,
    ];
    const content = [headers.join(","), row.join(",")].join("\n");
    return {
        filename: `production_${today.toISOString().slice(0, 10)}.csv`,
        mime: "text/csv",
        content,
    };
}
