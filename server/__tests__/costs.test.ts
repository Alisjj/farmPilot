import { CostsService } from "../src/services/costsService";

describe("CostsService smoke tests", () => {
  it("computeDailyCost returns expected shape for a date string", async () => {
    const res = await CostsService.computeDailyCost("2025-08-01", "per_egg");
    expect(res).toHaveProperty("date", "2025-08-01");
    expect(res).toHaveProperty("total_eggs_produced");
    expect(res).toHaveProperty("total_cost_per_egg");
  });

  it("recalculateRange processes a small date range", async () => {
    const results = await CostsService.recalculateRange("2025-08-01", "2025-08-03", "per_egg");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);
    for (const r of results) {
      expect(r).toHaveProperty("date");
      expect(r).toHaveProperty("total_cost_per_egg");
    }
  });
});
