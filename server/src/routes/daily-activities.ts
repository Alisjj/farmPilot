import { Router } from "express";
import { db } from "../db";
import { daily_logs } from "../../../shared/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import throwIfInvalid from "../lib/validation";
import { DailyActivityCreateDTO, DailyActivityUpdateDTO } from "../types/dtos";
import { mapDailyActivityRowToApi } from "../lib/mappers";

const baseDailyActivitySchema = z.object({
  log_date: z.string().refine((s) => !Number.isNaN(Date.parse(s))),
  house_id: z.number().optional(),
  eggs_total: z.number().optional(),
  eggs_grade_a: z.number().optional(),
  eggs_grade_b: z.number().optional(),
  eggs_grade_c: z.number().optional(),
  feed_given_kg: z.number().optional(),
  mortality_count: z.number().optional(),
  notes: z.string().optional(),
  supervisor_id: z.number().optional(),
});

const validateEggsTotal = (data: any) => {
  // Validate eggs_total = eggs_grade_a + eggs_grade_b + eggs_grade_c if any are provided
  const total = data.eggs_total ?? 0;
  const gradeA = data.eggs_grade_a ?? 0;
  const gradeB = data.eggs_grade_b ?? 0;
  const gradeC = data.eggs_grade_c ?? 0;
  return total === gradeA + gradeB + gradeC;
};

const insertDailyActivitySchema = baseDailyActivitySchema.refine(
  validateEggsTotal,
  {
    message:
      "eggs_total must equal the sum of eggs_grade_a + eggs_grade_b + eggs_grade_c",
  }
);

const updateDailyActivitySchema = baseDailyActivitySchema
  .partial()
  .omit({ log_date: true })
  .refine(validateEggsTotal, {
    message:
      "eggs_total must equal the sum of eggs_grade_a + eggs_grade_b + eggs_grade_c",
  });

const router = Router();

// GET /api/daily-activities?date=YYYY-MM-DD
router.get("/", async (req, res, next) => {
  const date = req.query.date as string | undefined;
  try {
    if (date) {
      const rows = await db
        .select()
        .from(daily_logs)
        .where(sql`${daily_logs.log_date} = ${date}`);
      return res.ok(rows.map(mapDailyActivityRowToApi));
    }
    const rows = await db
      .select()
      .from(daily_logs)
      .limit(100)
      .orderBy(daily_logs.log_date);
    res.ok(rows.map(mapDailyActivityRowToApi));
  } catch (err) {
    next(err);
  }
});

// POST /api/daily-activities
router.post("/", async (req, res, next) => {
  try {
    const parsed = insertDailyActivitySchema.safeParse(req.body);
    const data = throwIfInvalid(parsed) as DailyActivityCreateDTO;

    // Drizzle decimal columns expect string|SQL|Placeholder types for numeric decimals.
    const toInsert = {
      ...data,
      feed_given_kg:
        data.feed_given_kg !== undefined
          ? String(data.feed_given_kg)
          : undefined,
    };

    const result = await db.insert(daily_logs).values(toInsert).returning();
    res.ok(mapDailyActivityRowToApi(result[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/daily-activities/:id
router.put("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.fail(400, { error: "invalid_id" });
  }

  try {
    const parsed = updateDailyActivitySchema.safeParse(req.body);
    const data = throwIfInvalid(parsed) as DailyActivityUpdateDTO;

    const toUpdate = {
      ...data,
      feed_given_kg:
        data.feed_given_kg !== undefined
          ? String(data.feed_given_kg)
          : undefined,
    };

    const result = await db
      .update(daily_logs)
      .set(toUpdate)
      .where(sql`${daily_logs.id} = ${id}`)
      .returning();

    if (result.length === 0) return res.fail(404, { error: "not_found" });

    res.ok(mapDailyActivityRowToApi(result[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/daily-activities/:id
router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.fail(400, { error: "invalid_id" });
  }

  try {
    const result = await db
      .delete(daily_logs)
      .where(sql`${daily_logs.id} = ${id}`)
      .returning();

    if (result.length === 0) {
      return res.fail(404, { error: "not_found" });
    }

    res.ok({ deleted: true, id: result[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
