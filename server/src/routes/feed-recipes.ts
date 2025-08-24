import { Router, Request, Response } from "express";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  feed_recipes,
  recipe_ingredients,
  ingredients,
} from "../../../shared/schema";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { RecipeService } from "../services/recipeService";

const router = Router();

// Validation schemas
const createRecipeSchema = z.object({
  recipe_name: z.string().min(1).max(100),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive(),
        percentage: z.number().min(0).max(100),
      })
    )
    .min(1),
  other_ingredients: z.any().optional(),
});

const updateRecipeSchema = z.object({
  recipe_name: z.string().min(1).max(100).optional(),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive(),
        percentage: z.number().min(0).max(100),
      })
    )
    .min(1)
    .optional(),
  other_ingredients: z.any().optional(),
  is_active: z.boolean().optional(),
});

const queryRecipesSchema = z.object({
  is_active: z.enum(["true", "false"]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/feed-recipes - List all feed recipes with ingredients
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(queryRecipesSchema.safeParse(req.query));

    let whereConditions = [];

    // Filter by active status
    if (query.is_active !== undefined) {
      whereConditions.push(
        eq(feed_recipes.is_active, query.is_active === "true")
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get recipes with ingredients
    const recipes = await db
      .select({
        id: feed_recipes.id,
        recipe_name: feed_recipes.recipe_name,
        other_ingredients: feed_recipes.other_ingredients,
        is_active: feed_recipes.is_active,
        created_at: feed_recipes.created_at,
      })
      .from(feed_recipes)
      .where(whereClause)
      .orderBy(desc(feed_recipes.created_at))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    // Get ingredients for each recipe
    const recipesWithIngredients = await Promise.all(
      recipes.map(async (r: any) => RecipeService.getRecipeById(r.id))
    );

    res.json({
      recipes: recipesWithIngredients,
      total: recipesWithIngredients.length,
    });
  } catch (error) {
    console.error("Error fetching feed recipes:", error);
    res.status(500).json({
      error: "Failed to fetch feed recipes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/feed-recipes/:id - Get specific recipe with ingredients
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }

    const recipe = await RecipeService.getRecipeById(recipeId);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({
      error: "Failed to fetch recipe",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/feed-recipes - Create new feed recipe
router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const recipeData = throwIfInvalid(createRecipeSchema.safeParse(req.body));

      try {
        const created = await RecipeService.createRecipe(recipeData);
        res.status(201).json({
          message: "Feed recipe created successfully",
          recipe: created,
        });
      } catch (err: any) {
        // Map service errors to HTTP responses
        if (err && err.code === "BAD_REQUEST") {
          return res
            .status(400)
            .json({ error: err.message, details: err.details });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error creating feed recipe:", error);
      res.status(500).json({
        error: "Failed to create feed recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// PUT /api/feed-recipes/:id - Update feed recipe
router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      if (isNaN(recipeId)) {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const updateData = throwIfInvalid(updateRecipeSchema.safeParse(req.body));

      try {
        const updated = await RecipeService.updateRecipe(
          recipeId,
          updateData as any
        );
        if (!updated)
          return res.status(404).json({ error: "Recipe not found" });
        res.json({
          message: "Feed recipe updated successfully",
          recipe: updated,
        });
      } catch (err: any) {
        if (err && err.code === "BAD_REQUEST") {
          return res
            .status(400)
            .json({ error: err.message, details: err.details });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error updating feed recipe:", error);
      res.status(500).json({
        error: "Failed to update feed recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
