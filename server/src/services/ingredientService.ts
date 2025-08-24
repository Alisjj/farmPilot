import * as repo from "../repositories/ingredientRepo";
import { ConflictError } from "../lib/errors";
import { eq } from "drizzle-orm";
import { IngredientCreateDTO, IngredientUpdateDTO } from "../types/dtos";

export async function findByName(name: string) {
  return repo.findByName(name);
}

export async function getById(id: number) {
  return repo.findById(id);
}

export async function createIngredient(payload: IngredientCreateDTO) {
  // Duplicate check
  const existing = await repo.findByName(payload.name);
  if (existing) {
    throw new ConflictError("Ingredient name already exists");
  }

  const created = await repo.insertIngredient(payload);
  return created || { id: 0, ...payload };
}

export async function updateIngredient(
  id: number,
  update: IngredientUpdateDTO
) {
  const exists = await getById(id);
  if (!exists) return null;

  // If name is changing, ensure no conflict
  if (update.name && update.name !== exists.name) {
    const conflict = await repo.findByName(update.name);
    if (conflict) {
      throw new ConflictError(
        `An ingredient named "${update.name}" already exists`
      );
    }
  }

  const updated = await repo.updateIngredientRow(id, update);
  return updated || { id, ...update };
}

export async function listIngredients(limit = 50, offset = 0, search?: string) {
  // lightweight listing used by routes
  const where = search ? undefined : undefined; // keep simple; routes handle search currently
  return repo.listIngredients(limit, offset);
}

export default {
  findByName,
  getById,
  createIngredient,
  updateIngredient,
  listIngredients,
};

export const IngredientService = {
  findByName,
  getById,
  createIngredient,
  updateIngredient,
  listIngredients,
};
