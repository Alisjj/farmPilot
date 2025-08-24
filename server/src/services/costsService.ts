import { db } from "../db";
import {
  daily_logs,
  feed_batches,
  operating_costs,
  monthly_payroll,
  daily_costs,
} from "../../../shared/schema";
import { sql, eq, lte, desc } from "drizzle-orm";

function daysInMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export const CostsService = {
  // Compute and persist daily costs (idempotent)
  // allocation: 'per_egg' | 'per_house'
  async computeDailyCost(
    dateStr: string,
    allocation: "per_egg" | "per_house" = "per_egg"
  ) {
    // dateStr: YYYY-MM-DD
    const month = dateStr.slice(0, 7); // YYYY-MM

    // total eggs and feed given for the date, grouped by house
    const logs = await db
      .select()
      .from(daily_logs)
      .where(eq(daily_logs.log_date, dateStr));
    const totalEggs = logs.reduce(
      (s: number, r: any) => s + (r.eggs_total || 0),
      0
    );
    const totalFeedKg = logs.reduce(
      (s: number, r: any) => s + Number(r.feed_given_kg || 0),
      0
    );

    // group per-house
    const byHouse: Record<
      string,
      { house_id: number | null; eggs: number; feed_kg: number }
    > = {};
    for (const r of logs) {
      const h = r.house_id ? String(r.house_id) : "_unknown";
      if (!byHouse[h])
        byHouse[h] = { house_id: r.house_id ?? null, eggs: 0, feed_kg: 0 };
      byHouse[h].eggs += Number(r.eggs_total || 0);
      byHouse[h].feed_kg += Number(r.feed_given_kg || 0);
    }

    // Determine feed cost per kg using a weighted average of recent batches (last 5 batches on or before date)
    const recentBatches = await db
      .select()
      .from(feed_batches)
      .where(lte(feed_batches.batch_date, dateStr))
      .orderBy(desc(feed_batches.batch_date))
      .limit(5);

    let feedCostPerKg = 0;
    if (recentBatches.length > 0) {
      // weighted by batch size
      let totalWeight = 0;
      let weightedSum = 0;
      for (const b of recentBatches) {
        const size = Number(b.batch_size_kg || 0);
        const costPerKg = Number(b.cost_per_kg || 0);
        totalWeight += size;
        weightedSum += costPerKg * size;
      }
      feedCostPerKg =
        totalWeight > 0
          ? weightedSum / totalWeight
          : Number(recentBatches[0].cost_per_kg || 0);
    }
    const totalFeedCost = feedCostPerKg * totalFeedKg;

    // operating monthly costs
    const ops = await db
      .select()
      .from(operating_costs)
      .where(eq(operating_costs.month_year, sql`${month}::date`))
      .limit(1);
    const monthlyOps =
      ops.length > 0 ? Number(ops[0].total_monthly_cost || 0) : 0;

    // payroll monthly total
    const payrolls = await db
      .select()
      .from(monthly_payroll)
      .where(eq(monthly_payroll.month_year, sql`${month}::date`));
    const totalPayroll = payrolls.reduce(
      (s: number, p: any) => s + Number(p.final_salary || 0),
      0
    );

    const days = daysInMonth(month);
    const dailyOpShare = monthlyOps / days;
    const dailyPayrollShare = totalPayroll / days;

    const fixedCostsTotal = dailyOpShare + dailyPayrollShare;

    const feedCostPerEgg = totalEggs > 0 ? totalFeedCost / totalEggs : 0;
    const fixedCostPerEgg = totalEggs > 0 ? fixedCostsTotal / totalEggs : 0;
    const totalCostPerEgg = feedCostPerEgg + fixedCostPerEgg;

    // per-house allocation details (not persisted by default)
    const houseAllocations: any[] = [];
    if (allocation === "per_house") {
      for (const key of Object.keys(byHouse)) {
        const entry = byHouse[key];
        const houseEggs = entry.eggs;
        const houseFeedKg = entry.feed_kg;
        const houseFeedCost = feedCostPerKg * houseFeedKg;
        const housePayrollShare =
          totalEggs > 0 ? dailyPayrollShare * (houseEggs / totalEggs) : 0;
        const houseOpShare =
          monthlyOps > 0 ? dailyOpShare * (houseEggs / totalEggs) : 0;
        const houseFixedTotal = housePayrollShare + houseOpShare;
        const houseFixedPerEgg =
          houseEggs > 0 ? houseFixedTotal / houseEggs : 0;
        const houseFeedPerEgg = houseEggs > 0 ? houseFeedCost / houseEggs : 0;
        const houseTotalPerEgg = houseFeedPerEgg + houseFixedPerEgg;
        houseAllocations.push({
          house_id: entry.house_id,
          eggs: houseEggs,
          feed_kg: houseFeedKg,
          feed_cost: houseFeedCost,
          payroll_share: housePayrollShare,
          op_share: houseOpShare,
          fixed_cost_per_egg: houseFixedPerEgg,
          feed_cost_per_egg: houseFeedPerEgg,
          total_cost_per_egg: houseTotalPerEgg,
        });
      }
    }

    const suggestedA = Number((totalCostPerEgg * 1.2).toFixed(2));
    const suggestedB = Number((totalCostPerEgg * 1.1).toFixed(2));
    const suggestedC = Number((totalCostPerEgg * 1.0).toFixed(2));

    // upsert into daily_costs (persist overall per-date numbers)
    const existing = await db
      .select()
      .from(daily_costs)
      .where(eq(daily_costs.cost_date, dateStr))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(daily_costs)
        .set({
          total_feed_cost: totalFeedCost,
          total_eggs_produced: totalEggs,
          feed_cost_per_egg: feedCostPerEgg,
          fixed_cost_per_egg: fixedCostPerEgg,
          total_cost_per_egg: totalCostPerEgg,
          suggested_price_grade_a: suggestedA,
          suggested_price_grade_b: suggestedB,
          suggested_price_grade_c: suggestedC,
        })
        .where(eq(daily_costs.cost_date, dateStr));
    } else {
      await db
        .insert(daily_costs)
        .values({
          cost_date: dateStr,
          total_feed_cost: totalFeedCost,
          total_eggs_produced: totalEggs,
          feed_cost_per_egg: feedCostPerEgg,
          fixed_cost_per_egg: fixedCostPerEgg,
          total_cost_per_egg: totalCostPerEgg,
          suggested_price_grade_a: suggestedA,
          suggested_price_grade_b: suggestedB,
          suggested_price_grade_c: suggestedC,
        })
        .returning();
    }

    return {
      date: dateStr,
      total_feed_cost: totalFeedCost,
      total_eggs_produced: totalEggs,
      feed_cost_per_egg: feedCostPerEgg,
      fixed_cost_per_egg: fixedCostPerEgg,
      total_cost_per_egg: totalCostPerEgg,
      suggested_price_grade_a: suggestedA,
      suggested_price_grade_b: suggestedB,
      suggested_price_grade_c: suggestedC,
      allocation: allocation,
      house_allocations: houseAllocations,
    };
  },

  // Recalculate costs for a date range (inclusive). allocation optional.
  async recalculateRange(
    startDate: string,
    endDate: string,
    allocation: "per_egg" | "per_house" = "per_egg"
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const results: any[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const res = await this.computeDailyCost(dateStr, allocation);
      results.push(res);
    }
    return results;
  },
};
