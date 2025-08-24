import { Request, Response, Router } from "express";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { sales, customers } from "../../../shared/schema";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { mapSaleRowToApi } from "../lib/mappers";

const router = Router();

// Validation schemas
const createSaleSchema = z
  .object({
    sale_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    customer_id: z.number().int().positive().optional(),
    grade_a_qty: z.number().int().min(0).default(0),
    grade_a_price: z.number().min(0).default(0),
    grade_b_qty: z.number().int().min(0).default(0),
    grade_b_price: z.number().min(0).default(0),
    grade_c_qty: z.number().int().min(0).default(0),
    grade_c_price: z.number().min(0).default(0),
    payment_method: z.enum(["cash", "transfer", "check"]),
    payment_status: z.enum(["paid", "pending"]).default("pending"),
    supervisor_id: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // At least one grade must have quantity > 0
      return (
        data.grade_a_qty > 0 || data.grade_b_qty > 0 || data.grade_c_qty > 0
      );
    },
    {
      message: "At least one egg grade must have quantity greater than 0",
    }
  )
  .transform((data) => {
    // Calculate total amount
    const total_amount =
      data.grade_a_qty * data.grade_a_price +
      data.grade_b_qty * data.grade_b_price +
      data.grade_c_qty * data.grade_c_price;

    return {
      ...data,
      total_amount,
    };
  });

const updateSaleSchema = z
  .object({
    sale_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    customer_id: z.number().int().positive().optional(),
    grade_a_qty: z.number().int().min(0).optional(),
    grade_a_price: z.number().min(0).optional(),
    grade_b_qty: z.number().int().min(0).optional(),
    grade_b_price: z.number().min(0).optional(),
    grade_c_qty: z.number().int().min(0).optional(),
    grade_c_price: z.number().min(0).optional(),
    payment_method: z.enum(["cash", "transfer", "check"]).optional(),
    payment_status: z.enum(["paid", "pending"]).optional(),
    supervisor_id: z.number().int().positive().optional(),
  })
  .transform((data) => {
    // Calculate total amount if quantities/prices are provided
    const grade_a_qty = data.grade_a_qty ?? 0;
    const grade_a_price = data.grade_a_price ?? 0;
    const grade_b_qty = data.grade_b_qty ?? 0;
    const grade_b_price = data.grade_b_price ?? 0;
    const grade_c_qty = data.grade_c_qty ?? 0;
    const grade_c_price = data.grade_c_price ?? 0;

    const result: any = { ...data };

    if (
      data.grade_a_qty !== undefined ||
      data.grade_a_price !== undefined ||
      data.grade_b_qty !== undefined ||
      data.grade_b_price !== undefined ||
      data.grade_c_qty !== undefined ||
      data.grade_c_price !== undefined
    ) {
      result.total_amount =
        grade_a_qty * grade_a_price +
        grade_b_qty * grade_b_price +
        grade_c_qty * grade_c_price;
    }

    return result;
  });

const querySalesSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  customer_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  payment_status: z.enum(["paid", "pending"]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// GET /api/sales/summary - Sales summary and analytics
router.get("/summary", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(
      z
        .object({
          start_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          end_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          group_by: z.enum(["day", "week", "month"]).default("day"),
        })
        .safeParse(req.query)
    );

    let whereConditions = [];

    if (query.start_date) {
      whereConditions.push(gte(sales.sale_date, query.start_date));
    }
    if (query.end_date) {
      whereConditions.push(lte(sales.sale_date, query.end_date));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get summary statistics
    const summary = await db
      .select({
        total_sales: sql<number>`count(*)::int`,
        total_revenue: sql<number>`sum(${sales.total_amount})::numeric`,
        total_eggs: sql<number>`sum(${sales.grade_a_qty} + ${sales.grade_b_qty} + ${sales.grade_c_qty})::int`,
        avg_sale_amount: sql<number>`avg(${sales.total_amount})::numeric`,
        grade_a_total: sql<number>`sum(${sales.grade_a_qty})::int`,
        grade_b_total: sql<number>`sum(${sales.grade_b_qty})::int`,
        grade_c_total: sql<number>`sum(${sales.grade_c_qty})::int`,
        paid_sales: sql<number>`sum(case when ${sales.payment_status} = 'paid' then 1 else 0 end)::int`,
        pending_sales: sql<number>`sum(case when ${sales.payment_status} = 'pending' then 1 else 0 end)::int`,
      })
      .from(sales)
      .where(whereClause);

    res.json({
      summary: summary[0],
      period: {
        start_date: query.start_date,
        end_date: query.end_date,
      },
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({
      error: "Failed to fetch sales summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/sales - List sales with optional filtering
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const query = throwIfInvalid(querySalesSchema.safeParse(req.query));

    let whereConditions = [];

    // Filter by specific date
    if (query.date) {
      whereConditions.push(eq(sales.sale_date, query.date));
    }

    // Filter by date range
    if (query.start_date) {
      whereConditions.push(gte(sales.sale_date, query.start_date));
    }
    if (query.end_date) {
      whereConditions.push(lte(sales.sale_date, query.end_date));
    }

    // Filter by customer
    if (query.customer_id) {
      whereConditions.push(eq(sales.customer_id, Number(query.customer_id)));
    }

    // Filter by payment status
    if (query.payment_status) {
      whereConditions.push(eq(sales.payment_status, query.payment_status));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Join with customers to get customer name
    const salesList = await db
      .select({
        id: sales.id,
        sale_date: sales.sale_date,
        customer_id: sales.customer_id,
        customer_name: customers.customer_name,
        grade_a_qty: sales.grade_a_qty,
        grade_a_price: sales.grade_a_price,
        grade_b_qty: sales.grade_b_qty,
        grade_b_price: sales.grade_b_price,
        grade_c_qty: sales.grade_c_qty,
        grade_c_price: sales.grade_c_price,
        total_amount: sales.total_amount,
        payment_method: sales.payment_method,
        payment_status: sales.payment_status,
        supervisor_id: sales.supervisor_id,
        created_at: sales.created_at,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.id))
      .where(whereClause)
      .orderBy(desc(sales.sale_date), desc(sales.created_at))
      .limit(query.limit || 50)
      .offset(query.offset || 0);

    res.json({
      sales: salesList.map(mapSaleRowToApi),
      total: salesList.length,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({
      error: "Failed to fetch sales",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/sales/:id - Get specific sale
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const saleId = parseInt(req.params.id);
    if (isNaN(saleId)) {
      return res.status(400).json({ error: "Invalid sale ID" });
    }

    const sale = await db
      .select({
        id: sales.id,
        sale_date: sales.sale_date,
        customer_id: sales.customer_id,
        customer_name: customers.customer_name,
        customer_phone: customers.phone,
        customer_email: customers.email,
        grade_a_qty: sales.grade_a_qty,
        grade_a_price: sales.grade_a_price,
        grade_b_qty: sales.grade_b_qty,
        grade_b_price: sales.grade_b_price,
        grade_c_qty: sales.grade_c_qty,
        grade_c_price: sales.grade_c_price,
        total_amount: sales.total_amount,
        payment_method: sales.payment_method,
        payment_status: sales.payment_status,
        supervisor_id: sales.supervisor_id,
        created_at: sales.created_at,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.id))
      .where(eq(sales.id, saleId))
      .limit(1);

    if (sale.length === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json(mapSaleRowToApi(sale[0]));
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({
      error: "Failed to fetch sale",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/sales - Create new sale
router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const saleData = throwIfInvalid(createSaleSchema.safeParse(req.body));

      // If no supervisor_id provided, use the authenticated user's ID
      if (!saleData.supervisor_id && req.user?.id) {
        saleData.supervisor_id = req.user.id;
      }

      const newSale = await db.insert(sales).values(saleData).returning();

      res.status(201).json({
        message: "Sale recorded successfully",
        sale: mapSaleRowToApi(newSale[0]),
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({
        error: "Failed to record sale",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// PUT /api/sales/:id - Update sale
router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req: Request, res: Response) => {
    try {
      const saleId = parseInt(req.params.id);
      if (isNaN(saleId)) {
        return res.status(400).json({ error: "Invalid sale ID" });
      }

      const updateData = throwIfInvalid(updateSaleSchema.safeParse(req.body));

      // Check if sale exists
      const existingSale = await db
        .select()
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1);

      if (existingSale.length === 0) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const updatedSale = await db
        .update(sales)
        .set(updateData)
        .where(eq(sales.id, saleId))
        .returning();

      res.json({
        message: "Sale updated successfully",
        sale: mapSaleRowToApi(updatedSale[0]),
      });
    } catch (error) {
      console.error("Error updating sale:", error);
      res.status(500).json({
        error: "Failed to update sale",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
