// Feed Management Types
export interface FeedRecipe {
  id: number;
  recipe_name: string;
  other_ingredients?: any;
  is_active: boolean;
  created_at: Date;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  created_at: Date;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  percentage: number;
  created_at: Date;
}

export interface FeedBatch {
  id: number;
  batch_date: string;
  batch_size_kg: number;
  recipe_id?: number;
  total_cost: number;
  cost_per_kg: number;
  created_at: Date;
}

export interface BatchIngredient {
  id: number;
  batch_id: number;
  ingredient_id?: number;
  ingredient_name: string;
  amount_kg: number;
  cost_per_kg: number;
  total_cost: number;
}

// Form/Input Types
export interface CreateFeedRecipeData {
  recipe_name: string;
  ingredients: {
    ingredient_id: number;
    percentage: number;
  }[];
  other_ingredients?: any;
}

export interface UpdateFeedRecipeData {
  recipe_name?: string;
  ingredients?: {
    ingredient_id: number;
    percentage: number;
  }[];
  other_ingredients?: any;
  is_active?: boolean;
}

export interface CreateIngredientData {
  name: string;
  unit?: string;
  price_per_unit?: number;
}

export interface UpdateIngredientData {
  name?: string;
  unit?: string;
  price_per_unit?: number;
}

export interface CreateFeedBatchData {
  batch_date: string;
  batch_size_kg: number;
  recipe_id?: number;
  ingredients: {
    ingredient_id?: number;
    ingredient_name: string;
    amount_kg: number;
    cost_per_kg: number;
  }[];
}

// Response Types
export interface FeedRecipeWithIngredients extends FeedRecipe {
  ingredients: (RecipeIngredient & {
    ingredient: Ingredient;
  })[];
}

export interface FeedBatchWithDetails extends FeedBatch {
  recipe?: FeedRecipe;
  ingredients: BatchIngredient[];
}

export interface BatchCostBreakdown {
  batch_id: number;
  batch_date: string;
  batch_size_kg: number;
  total_cost: number;
  cost_per_kg: number;
  ingredients: {
    ingredient_name: string;
    amount_kg: number;
    cost_per_kg: number;
    total_cost: number;
    percentage_of_batch: number;
  }[];
}

// API Response Types
export interface FeedRecipesResponse {
  recipes: FeedRecipeWithIngredients[];
  total: number;
}

export interface FeedBatchesResponse {
  batches: FeedBatchWithDetails[];
  total: number;
}

export interface IngredientsResponse {
  ingredients: Ingredient[];
  total: number;
}
