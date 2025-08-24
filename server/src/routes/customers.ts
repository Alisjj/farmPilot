import { Request, Response, Router } from "express";
import { eq, desc, and, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { customers } from "../../../shared/schema";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { mapCustomerRowToApi } from "../lib/mappers";

const router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  address: z.string().optional(),
  preferred_contact: z.enum(["phone", "email"]).default("phone"),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  is_active: z.boolean().optional(),
});

const queryCustomersSchema = z.object({
  search: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/customers - List customers with optional filtering
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(queryCustomersSchema.safeParse(req.query));

    let whereConditions = [];

    // Filter by active status
    if (query.active !== undefined) {
      whereConditions.push(eq(customers.is_active, query.active === "true"));
    }

    // Search by name, phone, or email
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      whereConditions.push(
        or(
          like(customers.customer_name, searchTerm),
          like(customers.phone, searchTerm),
          like(customers.email, searchTerm)
        )
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const customerList = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.created_at))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    res.json({
      customers: customerList.map(mapCustomerRowToApi),
      total: customerList.length,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      error: "Failed to fetch customers",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/customers/:id - Get specific customer
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(mapCustomerRowToApi(customer[0]));
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      error: "Failed to fetch customer",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/customers - Create new customer
router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const customerData = throwIfInvalid(
        createCustomerSchema.safeParse(req.body)
      );

      const newCustomer = await db
        .insert(customers)
        .values(customerData)
        .returning();

      res.status(201).json({
        message: "Customer created successfully",
        customer: mapCustomerRowToApi(newCustomer[0]),
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// PUT /api/customers/:id - Update customer
router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const updateData = throwIfInvalid(
        updateCustomerSchema.safeParse(req.body)
      );

      // Check if customer exists
      const existingCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (existingCustomer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const updatedCustomer = await db
        .update(customers)
        .set(updateData)
        .where(eq(customers.id, customerId))
        .returning();

      res.json({
        message: "Customer updated successfully",
        customer: mapCustomerRowToApi(updatedCustomer[0]),
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({
        error: "Failed to update customer",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
