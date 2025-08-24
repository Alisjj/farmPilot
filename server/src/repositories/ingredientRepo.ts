import { db } from "../db";
import { eq } from "drizzle-orm";
import { ingredients } from "../../../shared/schema";

export async function findByName(name: string) {
  const rows = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.name, name))
    .limit(1);
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function findById(id: number) {
  const rows = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.id, id))
    .limit(1);
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function insertIngredient(payload: any) {
  const inserted = await db.insert(ingredients).values(payload).returning();
  return inserted && inserted[0] ? inserted[0] : null;
}

export async function updateIngredientRow(id: number, update: any) {
  const updated = await db
    .update(ingredients)
    .set(update)
    .where(eq(ingredients.id, id))
    .returning();
  return updated && updated[0] ? updated[0] : null;
}

export async function listIngredients(limit = 50, offset = 0) {
  const rows = await db
    .select()
    .from(ingredients)
    .limit(limit)
    .offset(offset || 0);
  return rows || [];
}

export default {
  findByName,
  findById,
  insertIngredient,
  updateIngredientRow,
  listIngredients,
};
