import { Router, Request, Response } from "express";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  feed_batches,
  batch_ingredients,
  feed_recipes,
  ingredients,
} from "../../../shared/schema";
import { RecipeService } from "../services/recipeService";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { BatchService } from "../services/batchService";
import { mapBatchIngredientRowToApi, mapBatchRowToApi } from "../lib/mappers";

const router = Router();

// Lightweight row shapes used for clearer typing in mappings
interface BatchRow {
  id: number;
  batch_date: string;
  batch_size_kg: number | string;
  recipe_id: number | null;
  total_cost: number | string;
  cost_per_kg: number | string;
  created_at: Date | null;
  recipe_name?: string;
}

interface BatchIngredientRow {
  id: number;
  batch_id: number;
  ingredient_id?: number | null;
  ingredient_name: string;
  amount_kg: number | string;
  cost_per_kg: number | string;
  total_cost: number | string;
}

// Validation schemas
const createBatchSchema = z.object({
  batch_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  batch_size_kg: z.number().min(0.01),
  recipe_id: z.number().int().positive().optional(),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive().optional(),
        ingredient_name: z.string().min(1).max(50),
        amount_kg: z.number().min(0.01),
        cost_per_kg: z.number().min(0),
      })
    )
    .min(1),
});

const queryBatchesSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  recipe_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/feed-batches - List all feed batches
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(queryBatchesSchema.safeParse(req.query));

    let whereConditions = [];

    // Filter by date range
    if (query.start_date) {
      whereConditions.push(gte(feed_batches.batch_date, query.start_date));
    }
    if (query.end_date) {
      whereConditions.push(lte(feed_batches.batch_date, query.end_date));
    }

    // Filter by recipe
    if (query.recipe_id) {
      whereConditions.push(eq(feed_batches.recipe_id, Number(query.recipe_id)));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get batches with recipe information
    const batches = await db
      .select({
        id: feed_batches.id,
        batch_date: feed_batches.batch_date,
        batch_size_kg: feed_batches.batch_size_kg,
        recipe_id: feed_batches.recipe_id,
        total_cost: feed_batches.total_cost,
        cost_per_kg: feed_batches.cost_per_kg,
        created_at: feed_batches.created_at,
        recipe_name: feed_recipes.recipe_name,
      })
      .from(feed_batches)
      .leftJoin(feed_recipes, eq(feed_batches.recipe_id, feed_recipes.id))
      .where(whereClause)
      .orderBy(desc(feed_batches.batch_date), desc(feed_batches.created_at))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    // Get ingredients for each batch and normalize
    const batchesWithIngredients = await Promise.all(
      batches.map(async (batch: BatchRow) => {
        const full = await BatchService.getBatchById(batch.id);
        return {
          ...mapBatchRowToApi(batch),
          recipe: batch.recipe_name
            ? { id: batch.recipe_id, recipe_name: batch.recipe_name }
            : null,
          ingredients: full
            ? full.ingredients.map((ing: any) =>
                mapBatchIngredientRowToApi(ing)
              )
            : [],
        };
      })
    );

    res.json({
      batches: batchesWithIngredients,
      total: batchesWithIngredients.length,
    });
  } catch (error) {
    console.error("Error fetching feed batches:", error);
    res.status(500).json({
      error: "Failed to fetch feed batches",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/feed-batches/:id - Get specific batch with ingredients
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const batchId = parseInt(req.params.id);
    if (isNaN(batchId)) {
      return res.status(400).json({ error: "Invalid batch ID" });
    }

    const batch = await BatchService.getBatchById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found" });
    res.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({
      error: "Failed to fetch batch",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/batch-ingredients/:batch_id - Get ingredients for specific batch
router.get(
  "/ingredients/:batch_id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const batchId = parseInt(req.params.batch_id);
      if (isNaN(batchId)) {
        return res.status(400).json({ error: "Invalid batch ID" });
      }

      // Use BatchService to fetch batch and ingredients
      const found = await BatchService.getBatchById(batchId);
      if (!found) return res.status(404).json({ error: "Batch not found" });

      const batchIngredients = (found.ingredients || [])
        .map((ing: any) => mapBatchIngredientRowToApi(ing))
        .sort(
          (a: any, b: any) =>
            parseFloat(b.total_cost?.toString() || "0") -
            parseFloat(a.total_cost?.toString() || "0")
        );

      // Calculate cost breakdown
      const totalCost = batchIngredients.reduce(
        (sum: number, ing: any) => sum + parseFloat(ing.total_cost.toString()),
        0
      );

      const costBreakdown = batchIngredients.map((ing: any) => ({
        ...ing,
        percentage_of_batch:
          totalCost > 0
            ? (parseFloat(ing.total_cost.toString()) / totalCost) * 100
            : 0,
      }));

      res.json({
        batch_id: batchId,
        ingredients: costBreakdown,
        total_cost: totalCost,
      });
    } catch (error) {
      console.error("Error fetching batch ingredients:", error);
      res.status(500).json({
        error: "Failed to fetch batch ingredients",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/feed-batches - Create new feed batch
router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const batchData = throwIfInvalid(createBatchSchema.safeParse(req.body));

      // Validate recipe exists if provided
      if (batchData.recipe_id) {
        const recipe = await RecipeService.getRecipeById(
          batchData.recipe_id as number
        );
        if (!recipe) {
          return res.status(400).json({
            error: "Invalid recipe",
            details: "Recipe ID does not exist",
          });
        }
      }

      // Validate ingredients total weight matches batch size
      // Use relative tolerance: 1% of batch size by default
      const totalWeight = batchData.ingredients.reduce(
        (sum: number, ing: any) => sum + Number(ing.amount_kg),
        0
      );
      const relativeTolerance = 0.01; // 1%
      const allowedDiff = Number(batchData.batch_size_kg) * relativeTolerance;

      if (
        Math.abs(totalWeight - Number(batchData.batch_size_kg)) > allowedDiff
      ) {
        return res.status(400).json({
          error: `Batch size (${batchData.batch_size_kg} kg) does not match total ingredient weight (${totalWeight} kg)`,
        });
      }

      // Calculate total cost
      const totalCost = batchData.ingredients.reduce(
        (sum, ing) => sum + ing.amount_kg * ing.cost_per_kg,
        0
      );
      const costPerKg = totalCost / batchData.batch_size_kg;

      try {
        const created = await BatchService.createBatch(batchData as any);
        res
          .status(201)
          .json({ message: "Feed batch created successfully", batch: created });
      } catch (err: any) {
        // BatchService assumes route validated; propagate errors as 400 when flagged
        if (err && err.code === "BAD_REQUEST") {
          return res
            .status(400)
            .json({ error: err.message, details: err.details });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error creating feed batch:", error);
      res.status(500).json({
        error: "Failed to create feed batch",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
