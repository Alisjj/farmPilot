import { generateProductionCSV } from "./generators/production";
import { generateInventoryCSV } from "./generators/inventory";

export type ReportType = "production" | "inventory";

export async function generateReport(type: ReportType) {
    switch (type) {
        case "production":
            return generateProductionCSV();
        case "inventory":
            return generateInventoryCSV();
        default:
            throw new Error("Unsupported report type");
    }
}

export function listAvailableReports() {
    return [
        { id: "production", label: "Production Summary (CSV)" },
        { id: "inventory", label: "Inventory Status (CSV)" },
    ];
}
