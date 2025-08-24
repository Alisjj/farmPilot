import { BadRequestError } from "../lib/errors";
import * as repo from "../repositories/recipeRepo";
import { ingredients } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { RecipeCreateDTO, RecipeUpdateDTO } from "../types/dtos";

export async function getRecipeById(id: number) {
  const found = await repo.findRecipeById(id);
  if (!found || !found.recipe) return null;

  const recipe = found.recipe as any;
  const recipeIngredients = found.ingredients as any[];

  return {
    ...recipe,
    ingredients: recipeIngredients.map((ri: any) => ({
      id: ri.id,
      recipe_id: ri.recipe_id,
      ingredient_id: ri.ingredient_id,
      percentage: ri.percentage,
      created_at: ri.created_at,
      ingredient: {
        id: ri.ingredient_id,
        name: ri.ingredient_name || "Unknown",
        ingredient_name: ri.ingredient_name || "Unknown",
        unit: ri.ingredient_unit || "kg",
        price_per_unit:
          ri.price_per_unit !== undefined
            ? String(ri.price_per_unit)
            : undefined,
      },
    })),
  };
}

export async function createRecipe(payload: RecipeCreateDTO) {
  // Validate percentages sum to ~100
  const total = payload.ingredients.reduce(
    (s: number, i: { ingredient_id: number; percentage: number }) =>
      s + i.percentage,
    0
  );
  if (Math.abs(total - 100) > 0.01) {
    throw new BadRequestError("Ingredient percentages must sum to 100%");
  }

  // Verify ingredients exist
  const ids = payload.ingredients.map((i) => i.ingredient_id);
  const existing = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(and(...ids.map((id) => eq(ingredients.id, id))));

  if (existing.length !== ids.length) {
    throw new BadRequestError(
      "Invalid ingredients",
      "One or more ingredient IDs do not exist"
    );
  }
  const created = await repo.insertRecipeRow({
    recipe_name: payload.recipe_name,
    other_ingredients: payload.other_ingredients,
  });

  const recipeId = created && created.id ? created.id : 0;

  const recipeIngredients = await repo.insertRecipeIngredients(
    recipeId,
    payload.ingredients
  );

  const createdRecipe = created || {
    id: recipeId,
    recipe_name: payload.recipe_name,
  };

  return {
    ...createdRecipe,
    ingredients: recipeIngredients || payload.ingredients,
  };
}

export async function updateRecipe(id: number, update: RecipeUpdateDTO) {
  // Check exists via repository
  const exists = await repo.findRecipeById(id);
  if (!exists || !exists.recipe) return null;

  // If updating ingredients, validate and replace
  if (update.ingredients) {
    const total = update.ingredients.reduce(
      (s: number, i: { ingredient_id: number; percentage: number }) =>
        s + i.percentage,
      0
    );
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestError("Ingredient percentages must sum to 100%");
    }

    const ids = update.ingredients.map(
      (i: { ingredient_id: number; percentage: number }) => i.ingredient_id
    );
    const existing = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(and(...ids.map((id) => eq(ingredients.id, id))));

    if (existing.length !== ids.length) {
      throw new BadRequestError(
        "Invalid ingredients",
        "One or more ingredient IDs do not exist"
      );
    }

    // Replace ingredients
    await repo.replaceRecipeIngredients(id, update.ingredients);
  }

  const updated = await repo.updateRecipeRow(id, {
    recipe_name: update.recipe_name,
    other_ingredients: update.other_ingredients,
    is_active: update.is_active,
  });

  return updated && updated ? updated : { id, ...update };
}

export const RecipeService = { getRecipeById, createRecipe, updateRecipe };
export default RecipeService;
