import request from "supertest";
import { createServer } from "http";

describe("Phase 5: Feed Management APIs", () => {
  let app: any;

  beforeEach(async () => {
    jest.resetModules();
    const { default: appModule } = await import("../src/app");
    app = appModule;
  });

  describe("Ingredients API", () => {
    test("POST /api/ingredients - should create a new ingredient", async () => {
      const ingredientData = {
        ingredient_name: "Corn",
        unit: "kg",
        price_per_unit: 2.5,
        supplier: "Local Farm Supply",
        nutritional_info: "High energy grain",
      };

      const response = await request(app)
        .post("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(ingredientData)
        .expect(201);

      expect(response.body.message).toBe("Ingredient created successfully");
      expect(response.body.ingredient).toBeDefined();
      expect(response.body.ingredient.ingredient_name).toBe(
        ingredientData.ingredient_name
      );
      expect(response.body.ingredient.price_per_unit).toBe(
        ingredientData.price_per_unit.toString()
      );
    });

    test("GET /api/ingredients - should list all ingredients", async () => {
      const response = await request(app)
        .get("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("ingredients");
      expect(Array.isArray(response.body.ingredients)).toBe(true);
    });

    test("GET /api/ingredients/search - should search ingredients", async () => {
      const response = await request(app)
        .get("/api/ingredients/search?query=corn")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("ingredients");
      expect(Array.isArray(response.body.ingredients)).toBe(true);
    });

    test("PUT /api/ingredients/:id - should update ingredient", async () => {
      const updateData = {
        price_per_unit: 2.75,
        supplier: "Updated Farm Supply",
      };

      const response = await request(app)
        .put("/api/ingredients/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Ingredient updated successfully");
      expect(response.body.ingredient.price_per_unit).toBe(
        updateData.price_per_unit.toString()
      );
    });

    test("POST /api/ingredients - should prevent duplicate ingredient names", async () => {
      const duplicateData = {
        ingredient_name: "Corn", // Same as created above
        unit: "kg",
        price_per_unit: 3.0,
      };

      const response = await request(app)
        .post("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(duplicateData)
        .expect(409);

      expect(response.body.error).toBe("Ingredient name already exists");
    });
  });

  describe("Feed Recipes API", () => {
    test("POST /api/feed-recipes - should create a new feed recipe", async () => {
      const recipeData = {
        recipe_name: "Starter Feed",
        ingredients: [
          { ingredient_id: 1, percentage: 60.0 },
          { ingredient_id: 2, percentage: 40.0 },
        ],
      };

      const response = await request(app)
        .post("/api/feed-recipes")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(recipeData)
        .expect(201);

      expect(response.body.message).toBe("Feed recipe created successfully");
      expect(response.body.recipe).toBeDefined();
      expect(response.body.recipe.recipe_name).toBe(recipeData.recipe_name);
    });

    test("POST /api/feed-recipes - should validate ingredient percentages sum to 100", async () => {
      const invalidRecipeData = {
        recipe_name: "Invalid Recipe",
        ingredients: [
          { ingredient_id: 1, percentage: 60.0 },
          { ingredient_id: 2, percentage: 30.0 }, // Only sums to 90%
        ],
      };

      const response = await request(app)
        .post("/api/feed-recipes")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(invalidRecipeData)
        .expect(400);

      expect(response.body.error).toBe(
        "Ingredient percentages must sum to 100%"
      );
    });

    test("GET /api/feed-recipes - should list all feed recipes", async () => {
      const response = await request(app)
        .get("/api/feed-recipes")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("recipes");
      expect(Array.isArray(response.body.recipes)).toBe(true);
    });

    test("GET /api/feed-recipes/:id - should get specific feed recipe with ingredients", async () => {
      const response = await request(app)
        .get("/api/feed-recipes/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body.recipe).toBeDefined();
      expect(response.body.recipe).toHaveProperty("ingredients");
      expect(Array.isArray(response.body.recipe.ingredients)).toBe(true);
    });

    test("PUT /api/feed-recipes/:id - should update feed recipe", async () => {
      const updateData = {
        recipe_name: "Updated Starter Feed",
        ingredients: [
          { ingredient_id: 1, percentage: 70.0 },
          { ingredient_id: 2, percentage: 30.0 },
        ],
      };

      const response = await request(app)
        .put("/api/feed-recipes/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe("Feed recipe updated successfully");
      expect(response.body.recipe.recipe_name).toBe(updateData.recipe_name);
    });
  });

  describe("Feed Batches API", () => {
    test("POST /api/feed-batches - should create a new feed batch", async () => {
      const batchData = {
        batch_date: "2024-01-15",
        batch_size_kg: 100.0,
        recipe_id: 1,
        ingredients: [
          {
            ingredient_id: 1,
            ingredient_name: "Corn",
            amount_kg: 70.0,
            cost_per_kg: 2.5,
          },
          {
            ingredient_id: 2,
            ingredient_name: "Soybean Meal",
            amount_kg: 30.0,
            cost_per_kg: 3.0,
          },
        ],
      };

      const response = await request(app)
        .post("/api/feed-batches")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(batchData)
        .expect(201);

      expect(response.body.message).toBe("Feed batch created successfully");
      expect(response.body.batch).toBeDefined();
      expect(response.body.batch.batch_size_kg).toBe(
        batchData.batch_size_kg.toString()
      );
      expect(response.body.batch.total_cost).toBeDefined();
      expect(response.body.batch.cost_per_kg).toBeDefined();
    });

    test("POST /api/feed-batches - should validate batch weight against ingredient totals", async () => {
      const invalidBatchData = {
        batch_date: "2024-01-15",
        batch_size_kg: 100.0,
        ingredients: [
          {
            ingredient_name: "Corn",
            amount_kg: 40.0, // Only 40kg total but batch is 100kg
            cost_per_kg: 2.5,
          },
        ],
      };

      const response = await request(app)
        .post("/api/feed-batches")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(invalidBatchData)
        .expect(400);

      expect(response.body.error).toBe(
        "Batch size (100 kg) does not match total ingredient weight (40 kg)"
      );
    });

    test("GET /api/feed-batches - should list all feed batches", async () => {
      const response = await request(app)
        .get("/api/feed-batches")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("batches");
      expect(Array.isArray(response.body.batches)).toBe(true);
    });

    test("GET /api/feed-batches/:id - should get specific batch with cost breakdown", async () => {
      const response = await request(app)
        .get("/api/feed-batches/1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body.batch).toBeDefined();
      expect(response.body.batch).toHaveProperty("cost_breakdown");
      expect(Array.isArray(response.body.batch.cost_breakdown)).toBe(true);
    });

    test("GET /api/feed-batches?recipe_id=1 - should filter batches by recipe", async () => {
      const response = await request(app)
        .get("/api/feed-batches?recipe_id=1")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("batches");
      // All batches should have recipe_id 1
      response.body.batches.forEach((batch: any) => {
        expect(batch.recipe_id).toBe(1);
      });
    });

    test("GET /api/feed-batches?start_date=2024-01-01&end_date=2024-01-31 - should filter by date range", async () => {
      const response = await request(app)
        .get("/api/feed-batches?start_date=2024-01-01&end_date=2024-01-31")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);

      expect(response.body).toHaveProperty("batches");
      expect(response.body).toHaveProperty("total");
    });
  });

  describe("Authorization Tests", () => {
    test("Supervisor can create ingredients", async () => {
      const ingredientData = {
        ingredient_name: "Test Ingredient",
        unit: "kg",
        price_per_unit: 1.0,
      };

      await request(app)
        .post("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "supervisor")
        .send(ingredientData)
        .expect(201);
    });

    test("Employee cannot create ingredients", async () => {
      const ingredientData = {
        ingredient_name: "Test Ingredient 2",
        unit: "kg",
        price_per_unit: 1.0,
      };

      await request(app)
        .post("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .send(ingredientData)
        .expect(403);
    });

    test("Employee can view ingredients", async () => {
      await request(app)
        .get("/api/ingredients")
        .set("authorization", "Bearer fake")
        .set("x-test-role", "employee")
        .expect(200);
    });

    test("Unauthenticated request should fail", async () => {
      await request(app).get("/api/ingredients").expect(401);
    });
  });
});
