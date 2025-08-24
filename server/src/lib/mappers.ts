import { RecipeIngredientDTO, BatchIngredientDTO } from "../types/dtos";

export function mapIngredientRowToApi(row: any) {
  return {
    ...row,
    ingredient_name: row.name || row.ingredient_name,
    price_per_unit:
      row.price_per_unit !== undefined ? String(row.price_per_unit) : undefined,
  };
}

export function mapRecipeRowToApi(recipe: any, ingredients: any[]) {
  return {
    ...recipe,
    ingredients: ingredients.map((ri: any) => ({
      id: ri.id,
      recipe_id: ri.recipe_id,
      ingredient_id: ri.ingredient_id,
      percentage: ri.percentage,
      created_at: ri.created_at,
      ingredient: {
        id: ri.ingredient_id,
        name: ri.ingredient_name || "Unknown",
        unit: ri.ingredient_unit || "kg",
        price_per_unit:
          ri.price_per_unit !== undefined
            ? String(ri.price_per_unit)
            : undefined,
      },
    })),
  };
}

export function mapBatchRowToApi(batch: any) {
  return {
    ...batch,
    batch_size_kg:
      batch.batch_size_kg !== undefined
        ? String(batch.batch_size_kg)
        : undefined,
    total_cost:
      batch.total_cost !== undefined ? String(batch.total_cost) : undefined,
    cost_per_kg:
      batch.cost_per_kg !== undefined ? String(batch.cost_per_kg) : undefined,
  };
}

export function mapBatchIngredientRowToApi(row: any) {
  return {
    ...row,
    ingredient_name: row.ingredient_name || row.name || "",
    amount_kg: row.amount_kg !== undefined ? String(row.amount_kg) : undefined,
    cost_per_kg:
      row.cost_per_kg !== undefined ? String(row.cost_per_kg) : undefined,
    total_cost:
      row.total_cost !== undefined ? String(row.total_cost) : undefined,
  };
}

export function mapDailyActivityRowToApi(row: any) {
  return {
    ...row,
    feed_given_kg:
      row.feed_given_kg !== undefined ? String(row.feed_given_kg) : undefined,
  };
}

export function mapCustomerRowToApi(row: any) {
  return {
    ...row,
  };
}

export function mapSaleRowToApi(row: any) {
  return {
    ...row,
    total_amount:
      row.total_amount !== undefined ? String(row.total_amount) : undefined,
  };
}

export function mapHouseRowToApi(row: any) {
  return {
    ...row,
  };
}

// update default export to include new mappers
export default {
  mapIngredientRowToApi,
  mapRecipeRowToApi,
  mapBatchRowToApi,
  mapBatchIngredientRowToApi,
  mapDailyActivityRowToApi,
  mapCustomerRowToApi,
  mapSaleRowToApi,
  mapHouseRowToApi,
};
