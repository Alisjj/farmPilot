import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { CostsService } from "../services/costsService";
import { db } from "../db";
import { operating_costs } from "../../../shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { throwIfInvalid } from "../lib/validation";

const router = Router();

router.get("/daily/:date", isAuthenticated, async (req, res) => {
  const date = req.params.date;
  const allocation = (req.query.allocation as any) || "per_egg";
  const result = await CostsService.computeDailyCost(date, allocation);
  res.json(result);
});

router.get("/egg-price/:date", isAuthenticated, async (req, res) => {
  const date = req.params.date;
  const result = await CostsService.computeDailyCost(date);
  res.json({
    date,
    price_grade_a: result.suggested_price_grade_a,
    price_grade_b: result.suggested_price_grade_b,
    price_grade_c: result.suggested_price_grade_c,
  });
});

const opsSchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/),
  supervisor_salary: z.number().min(0).optional(),
  total_laborer_salaries: z.number().min(0).optional(),
  electricity_cost: z.number().min(0).optional(),
  water_cost: z.number().min(0).optional(),
  maintenance_cost: z.number().min(0).optional(),
  other_costs: z.number().min(0).optional(),
  total_monthly_cost: z.number().min(0),
});

router.post(
  "/operating",
  isAuthenticated,
  authorize(["owner"]),
  async (req, res) => {
    const body = throwIfInvalid(opsSchema.safeParse(req.body));
    // upsert by month_year
    const monthDate = body.month_year + "-01";
    const existing = await db
      .select()
      .from(operating_costs)
      .where(eq(operating_costs.month_year, monthDate))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(operating_costs)
        .set(body as any)
        .where(eq(operating_costs.month_year, monthDate));
      res.json({ updated: true });
    } else {
      await db
        .insert(operating_costs)
        .values({ ...body, month_year: monthDate })
        .returning();
      res.status(201).json({ created: true });
    }
  }
);

// POST /api/costs/daily/recalculate
router.post(
  "/daily/recalculate",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const schema = z.object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      allocation: z.enum(["per_egg", "per_house"]).optional(),
    });
    const body = throwIfInvalid(schema.safeParse(req.body));
    const results = await CostsService.recalculateRange(
      body.start_date,
      body.end_date,
      body.allocation || "per_egg"
    );
    res.json({ processed: results.length });
  }
);

// GET /api/costs/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get(
  "/summary",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const schema = z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      allocation: z.enum(["per_egg", "per_house"]).optional(),
    });
    const parsed = throwIfInvalid(schema.safeParse(req.query));
    const { start, end, allocation } = parsed as any;

  // Use CostsService to compute or fetch persisted daily costs for each date in range.
    const results = await CostsService.recalculateRange(
      start,
      end,
      allocation || "per_egg"
    );

    // aggregate totals
    const totalDays = results.length;
    const totalEggs = results.reduce((s, r) => s + (r.total_eggs_produced || 0), 0);
    const avgTotalCostPerEgg =
      totalDays > 0
        ?
            results.reduce((s, r) => s + (r.total_cost_per_egg || 0), 0) /
            totalDays
        : 0;

    res.json({
      start,
      end,
      days: totalDays,
      total_eggs: totalEggs,
      avg_total_cost_per_egg: Number(avgTotalCostPerEgg.toFixed(4)),
      entries: results,
    });
  }
);

export default router;
