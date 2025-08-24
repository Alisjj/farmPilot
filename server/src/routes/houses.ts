import { Router } from "express";
import { db } from "../db";
import { houses } from "../../../shared/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import throwIfInvalid from "../lib/validation";
import { mapHouseRowToApi } from "../lib/mappers";

const createHouseSchema = z.object({
  house_name: z.string().min(1).max(50),
  capacity: z.number().int().min(1),
  current_bird_count: z.number().int().min(0).optional(),
});

const updateHouseSchema = createHouseSchema.partial();

const router = Router();

// GET /api/houses
router.get("/", async (req, res, next) => {
  try {
    const rows = await db.select().from(houses).orderBy(houses.house_name);
    res.ok(rows.map(mapHouseRowToApi));
  } catch (err) {
    next(err);
  }
});

// GET /api/houses/:id
router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.fail(400, { error: "invalid_id" });
  }

  try {
    const rows = await db
      .select()
      .from(houses)
      .where(sql`${houses.id} = ${id}`);

    if (rows.length === 0) {
      return res.fail(404, { error: "not_found" });
    }

    res.ok(mapHouseRowToApi(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/houses
router.post("/", async (req, res, next) => {
  const parsed = createHouseSchema.safeParse(req.body);
  const data = throwIfInvalid(parsed);

  try {
    // Validate current_bird_count doesn't exceed capacity
    if (data.current_bird_count && data.current_bird_count > data.capacity) {
      return res.fail(400, { error: "current_bird_count_exceeds_capacity" });
    }

    const result = await db.insert(houses).values(data).returning();
    res.ok(mapHouseRowToApi(result[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/houses/:id
router.put("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.fail(400, { error: "invalid_id" });
  }

  const parsed = updateHouseSchema.safeParse(req.body);
  const data = throwIfInvalid(parsed);

  try {
    // If updating capacity or current_bird_count, validate the constraint
    if (data.capacity !== undefined || data.current_bird_count !== undefined) {
      const existing = await db
        .select()
        .from(houses)
        .where(sql`${houses.id} = ${id}`);

      if (existing.length === 0) {
        return res.fail(404, { error: "not_found" });
      }

      const newCapacity = data.capacity ?? existing[0].capacity;
      const newBirdCount =
        data.current_bird_count ?? existing[0].current_bird_count ?? 0;

      if (newBirdCount > newCapacity) {
        return res.fail(400, { error: "current_bird_count_exceeds_capacity" });
      }
    }

    const result = await db
      .update(houses)
      .set(data)
      .where(sql`${houses.id} = ${id}`)
      .returning();

    if (result.length === 0) {
      return res.fail(404, { error: "not_found" });
    }

    res.ok(mapHouseRowToApi(result[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/houses/:id
router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.fail(400, { error: "invalid_id" });
  }

  try {
    const result = await db
      .delete(houses)
      .where(sql`${houses.id} = ${id}`)
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
