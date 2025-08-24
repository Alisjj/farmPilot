import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import {
  feed_recipes,
  recipe_ingredients,
  ingredients,
} from "../../../shared/schema";

export type RecipeIngredientRow = {
  id?: number;
  recipe_id: number;
  ingredient_id: number;
  percentage: number;
  created_at?: string;
  ingredient_name?: string;
  ingredient_unit?: string;
  price_per_unit?: number | string;
};

export type RecipeRow = {
  id: number;
  recipe_name: string;
  other_ingredients?: any;
  is_active?: boolean;
  created_at?: string;
};

export async function findRecipeById(id: number) {
  const recipe = await db
    .select()
    .from(feed_recipes)
    .where(eq(feed_recipes.id, id))
    .limit(1);

  if (!recipe || recipe.length === 0) return null;

  const recipeIngredients = await db
    .select({
      id: recipe_ingredients.id,
      recipe_id: recipe_ingredients.recipe_id,
      ingredient_id: recipe_ingredients.ingredient_id,
      percentage: recipe_ingredients.percentage,
      created_at: recipe_ingredients.created_at,
      ingredient_name: ingredients.name,
      ingredient_unit: ingredients.unit,
      price_per_unit: ingredients.price_per_unit,
    })
    .from(recipe_ingredients)
    .leftJoin(ingredients, eq(recipe_ingredients.ingredient_id, ingredients.id))
    .where(eq(recipe_ingredients.recipe_id, id))
    .orderBy(desc(recipe_ingredients.percentage));

  return {
    recipe: recipe[0] as RecipeRow,
    ingredients: recipeIngredients as any,
  };
}

export async function insertRecipeRow(payload: {
  recipe_name: string;
  other_ingredients?: any;
}) {
  const inserted = await db.insert(feed_recipes).values(payload).returning();
  return inserted && inserted[0] ? (inserted[0] as RecipeRow) : null;
}

export async function insertRecipeIngredients(
  recipeId: number,
  items: { ingredient_id: number; percentage: number }[]
) {
  const inserted = await db
    .insert(recipe_ingredients)
    .values(
      items.map((ing) => ({
        recipe_id: recipeId,
        ingredient_id: ing.ingredient_id,
        percentage: ing.percentage,
      }))
    )
    .returning();
  return inserted || [];
}

export async function replaceRecipeIngredients(
  recipeId: number,
  items: { ingredient_id: number; percentage: number }[]
) {
  await db
    .delete(recipe_ingredients)
    .where(eq(recipe_ingredients.recipe_id, recipeId));
  return insertRecipeIngredients(recipeId, items);
}

export async function updateRecipeRow(
  id: number,
  update: Partial<{
    recipe_name: string;
    other_ingredients: any;
    is_active: boolean;
  }>
) {
  const updated = await db
    .update(feed_recipes)
    .set(update)
    .where(eq(feed_recipes.id, id))
    .returning();
  return updated && updated[0] ? updated[0] : null;
}

export default {
  findRecipeById,
  insertRecipeRow,
  insertRecipeIngredients,
  replaceRecipeIngredients,
  updateRecipeRow,
};
