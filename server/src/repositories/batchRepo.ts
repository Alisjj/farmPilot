import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  feed_batches,
  batch_ingredients,
  feed_recipes,
} from "../../../shared/schema";

export async function findBatchById(id: number) {
  const batch = await db
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
    .where(eq(feed_batches.id, id))
    .limit(1);

  if (!batch || batch.length === 0) return null;

  const batchIngredients = await db
    .select()
    .from(batch_ingredients)
    .where(eq(batch_ingredients.batch_id, id));

  return { batch: batch[0], ingredients: batchIngredients };
}

export async function insertBatchRow(payload: {
  batch_date: string;
  batch_size_kg: number;
  recipe_id?: number;
  total_cost: number;
  cost_per_kg: number;
}) {
  const inserted = await db.insert(feed_batches).values(payload).returning();
  return inserted && inserted[0] ? inserted[0] : null;
}

export async function insertBatchIngredients(
  batchId: number,
  items: {
    ingredient_id?: number;
    ingredient_name: string;
    amount_kg: number;
    cost_per_kg: number;
  }[]
) {
  const inserted = await db
    .insert(batch_ingredients)
    .values(
      items.map((ing) => ({
        batch_id: batchId,
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name,
        amount_kg: ing.amount_kg,
        cost_per_kg: ing.cost_per_kg,
        total_cost: ing.amount_kg * ing.cost_per_kg,
      }))
    )
    .returning();
  return inserted || [];
}

export default { findBatchById, insertBatchRow, insertBatchIngredients };
