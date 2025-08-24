import { Router, Request, Response } from "express";
import { eq, desc, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { ingredients } from "../../../shared/schema";
import { IngredientService } from "../services/ingredientService";
import { mapIngredientRowToApi } from "../lib/mappers";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";

const router = Router();

// Validation schemas
const createIngredientSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    ingredient_name: z.string().min(1).max(100).optional(),
    unit: z.string().max(20).default("kg"),
    price_per_unit: z.union([z.number(), z.string()]).optional(),
    supplier: z.string().optional(),
    nutritional_info: z.string().optional(),
  })
  .refine((d) => !!(d.name || d.ingredient_name), {
    message: "Name is required",
    path: ["name"],
  });

const updateIngredientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unit: z.string().max(20).optional(),
  price_per_unit: z.number().min(0).optional(),
});

const queryIngredientsSchema = z.object({
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/ingredients/search - search helper
router.get("/search", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const q = String(req.query.query || "");
    const ingredientsList = await db
      .select()
      .from(ingredients)
      .where(like(ingredients.name, `%${q}%`))
      .orderBy(desc(ingredients.created_at))
      .limit(50);

    // normalize returned field to include ingredient_name for backwards compatibility with tests
    const normalized = ingredientsList.map((ing: any) =>
      mapIngredientRowToApi(ing)
    );

    res.json({ ingredients: normalized, total: normalized.length });
  } catch (error) {
    console.error("Error searching ingredients:", error);
    res.status(500).json({ error: "Failed to search ingredients" });
  }
});

// GET /api/ingredients - List all ingredients
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(queryIngredientsSchema.safeParse(req.query));

    let whereConditions = [];

    // Search by name
    if (query.search) {
      whereConditions.push(like(ingredients.name, `%${query.search}%`));
    }

    const whereClause =
      whereConditions.length > 0 ? or(...whereConditions) : undefined;

    const ingredientsList = await db
      .select()
      .from(ingredients)
      .where(whereClause)
      .orderBy(desc(ingredients.created_at))
      .limit(query.limit || 50)
      .offset(query.offset || 0);
    // normalize to include legacy `ingredient_name` and stringify price
    const normalized = ingredientsList.map((ing: any) =>
      mapIngredientRowToApi(ing)
    );

    res.json({
      ingredients: normalized,
      total: normalized.length,
    });
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({
      error: "Failed to fetch ingredients",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/ingredients/:id - Get specific ingredient
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const ingredientId = parseInt(req.params.id);
    if (isNaN(ingredientId)) {
      return res.status(400).json({ error: "Invalid ingredient ID" });
    }
    const ingredient = await IngredientService.getById(ingredientId);

    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    // normalize response to include legacy field and stringify price
    res.json(mapIngredientRowToApi(ingredient));
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({
      error: "Failed to fetch ingredient",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/ingredients - Create new ingredient
router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const parsed = throwIfInvalid(createIngredientSchema.safeParse(req.body));

      const name = parsed.name ?? parsed.ingredient_name;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const insertPayload: any = {
        name,
        unit: parsed.unit,
      };
      if (parsed.price_per_unit !== undefined)
        insertPayload.price_per_unit = parsed.price_per_unit;
      if (parsed.supplier) insertPayload.supplier = parsed.supplier;
      if (parsed.nutritional_info)
        insertPayload.nutritional_info = parsed.nutritional_info;

      try {
        const created = await IngredientService.createIngredient(insertPayload);

        res.status(201).json({
          message: "Ingredient created successfully",
          ingredient: {
            ...created,
            ingredient_name: created.name,
            price_per_unit:
              created.price_per_unit !== undefined
                ? String(created.price_per_unit)
                : undefined,
          },
        });
      } catch (err: any) {
        if (err && err.code === "CONFLICT") {
          return res
            .status(409)
            .json({ error: "Ingredient name already exists" });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error creating ingredient:", error);
      res.status(500).json({
        error: "Failed to create ingredient",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// PUT /api/ingredients/:id - Update ingredient
router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const ingredientId = parseInt(req.params.id);
      if (isNaN(ingredientId)) {
        return res.status(400).json({ error: "Invalid ingredient ID" });
      }

      const updateData = throwIfInvalid(
        updateIngredientSchema.safeParse(req.body)
      );

      // Delegate update to service which handles existence and conflicts
      try {
        const updated = await IngredientService.updateIngredient(
          ingredientId,
          updateData
        );

        if (!updated) {
          return res.status(404).json({ error: "Ingredient not found" });
        }

        res.json({
          message: "Ingredient updated successfully",
          ingredient: {
            ...updated,
            ingredient_name: updated.name,
            price_per_unit:
              updated.price_per_unit !== undefined
                ? String(updated.price_per_unit)
                : undefined,
          },
        });
      } catch (err: any) {
        if (err && err.code === "CONFLICT") {
          return res.status(409).json({
            error: "Name conflict",
            details: `An ingredient named "${updateData.name}" already exists`,
          });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error updating ingredient:", error);
      res.status(500).json({
        error: "Failed to update ingredient",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// DELETE /api/ingredients/:id - Delete ingredient
router.delete(
  "/:id",
  isAuthenticated,
  authorize(["owner"]),
  async (req: Request, res: Response) => {
    try {
      const ingredientId = parseInt(req.params.id);
      if (isNaN(ingredientId)) {
        return res.status(400).json({ error: "Invalid ingredient ID" });
      }

      // Check if ingredient exists
      const existingIngredient = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, ingredientId))
        .limit(1);

      if (existingIngredient.length === 0) {
        return res.status(404).json({ error: "Ingredient not found" });
      }

      // TODO: Check if ingredient is used in any recipes or batches
      // For now, we'll allow deletion but in production you might want to prevent this

      await db.delete(ingredients).where(eq(ingredients.id, ingredientId));

      res.json({
        message: "Ingredient deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      res.status(500).json({
        error: "Failed to delete ingredient",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
