import { storage } from "../../storage";

export async function generateInventoryCSV() {
    const items = await storage.getInventoryItems();
    const headers = [
        "id",
        "name",
        "category",
        "currentStock",
        "unit",
        "reorderPoint",
    ];
    const lines = [headers.join(",")];
    for (const it of items as any[]) {
        lines.push(
            [
                it.id,
                JSON.stringify(it.name || ""),
                it.category || "",
                it.currentStock ?? 0,
                it.unit || "",
                it.reorderPoint ?? "",
            ].join(",")
        );
    }
    const content = lines.join("\n");
    const today = new Date().toISOString().slice(0, 10);
    return { filename: `inventory_${today}.csv`, mime: "text/csv", content };
}
