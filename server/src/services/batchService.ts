import * as repo from "../repositories/batchRepo";
import { BadRequestError } from "../lib/errors";
import { BatchCreateDTO } from "../types/dtos";

export async function getBatchById(id: number) {
  const found = await repo.findBatchById(id);
  if (!found || !found.batch) return null;

  return {
    ...found.batch,
    ingredients: found.ingredients.map((bi: any) => ({
      ...bi,
      ingredient_name: bi.ingredient_name || bi.name || "",
      amount_kg: bi.amount_kg !== undefined ? String(bi.amount_kg) : undefined,
      cost_per_kg:
        bi.cost_per_kg !== undefined ? String(bi.cost_per_kg) : undefined,
      total_cost:
        bi.total_cost !== undefined ? String(bi.total_cost) : undefined,
    })),
  };
}

export async function createBatch(payload: BatchCreateDTO) {
  // validate payload and compute totals here
  if (!payload.batch_size_kg || payload.batch_size_kg <= 0) {
    throw new BadRequestError("Invalid batch_size_kg");
  }
  const totalCost = payload.ingredients.reduce(
    (
      s: number,
      ing: {
        ingredient_id?: number;
        ingredient_name: string;
        amount_kg: number;
        cost_per_kg: number;
      }
    ) => s + ing.amount_kg * ing.cost_per_kg,
    0
  );
  const costPerKg = totalCost / payload.batch_size_kg;

  const created = await repo.insertBatchRow({
    batch_date: payload.batch_date,
    batch_size_kg: payload.batch_size_kg,
    recipe_id: payload.recipe_id,
    total_cost: totalCost,
    cost_per_kg: costPerKg,
  });

  const batchId = created && created.id ? created.id : 0;

  const batchIngredients = await repo.insertBatchIngredients(
    batchId,
    payload.ingredients
  );

  const createdBatch = created || {
    id: batchId,
    batch_date: payload.batch_date,
    batch_size_kg: payload.batch_size_kg,
    recipe_id: payload.recipe_id,
    total_cost: totalCost,
    cost_per_kg: costPerKg,
  };

  return {
    ...createdBatch,
    batch_size_kg: String(createdBatch.batch_size_kg),
    total_cost: String(createdBatch.total_cost),
    cost_per_kg: String(createdBatch.cost_per_kg),
    ingredients: batchIngredients || payload.ingredients,
  };
}

export const BatchService = { getBatchById, createBatch };
export default BatchService;
