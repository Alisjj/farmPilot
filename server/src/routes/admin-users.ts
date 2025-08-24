import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { users } from "@shared/schema";
import { eq, sql, desc, asc } from "drizzle-orm";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import throwIfInvalid from "../lib/validation";
import bcrypt from "bcrypt";

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["admin", "staff"]),
  full_name: z.string().optional(),
});

// All admin user routes require authentication + admin role
router.use(isAuthenticated, authorize(["admin"]));

// GET /api/admin/users - list users
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize || 25))
    );
    const offset = (page - 1) * pageSize;

    // filters
    const roleFilter =
      typeof req.query.role === "string" && req.query.role
        ? String(req.query.role)
        : undefined;
    const q =
      typeof req.query.q === "string" && req.query.q
        ? String(req.query.q)
        : undefined; // username search

    // sorting
    const sortBy = String(req.query.sortBy || "created_at");
    const sortOrder =
      String(req.query.sortOrder || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    // build count query with optional filters
    let countQuery: any = db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    if (roleFilter) countQuery = countQuery.where(eq(users.role, roleFilter));
    if (q)
      countQuery = countQuery.where(
        sql`${users.username} ILIKE ${"%" + q + "%"}`
      );

    const [{ count }] = await countQuery;
    const total = Number((count as unknown) || 0);

    // build rows query
    let rowsQuery: any = db.select().from(users);
    if (roleFilter) rowsQuery = rowsQuery.where(eq(users.role, roleFilter));
    if (q)
      rowsQuery = rowsQuery.where(
        sql`${users.username} ILIKE ${"%" + q + "%"}`
      );

    // apply sorting
    const allowedSorts: Record<string, any> = {
      username: users.username,
      created_at: users.created_at,
      role: users.role,
    };
    const sortColumn = allowedSorts[sortBy] || users.created_at;
    if (sortOrder === "asc") rowsQuery = rowsQuery.orderBy(asc(sortColumn));
    else rowsQuery = rowsQuery.orderBy(desc(sortColumn));

    const rows = await rowsQuery.limit(pageSize).offset(offset);

    const items = rows.map((u: any) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      full_name: u.full_name,
      is_active: u.is_active,
    }));

    return res.ok({
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      items,
    });
  } catch (err) {
    next(err);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    const data = throwIfInvalid(parsed);

    const hash = await bcrypt.hash(data.password, 10);
    const [created] = await db
      .insert(users)
      .values({
        username: data.username,
        password_hash: hash,
        role: data.role,
        full_name: data.full_name ?? "",
      })
      .returning();
    return res.ok({
      id: created.id,
      username: created.username,
      role: created.role,
      full_name: created.full_name,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role - change role
router.put("/:id/role", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.fail(400, { error: "invalid id" });

    const { role } = req.body as { role?: string };
    if (!role || !["admin", "staff"].includes(role))
      return res.fail(400, { error: "invalid role" });

    // Prevent demoting the last admin
    const target = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((r: any) => r[0]);
    if (!target) return res.fail(404, { error: "not_found" });

    if (target.role === "admin" && role !== "admin") {
      const admins = await db
        .select()
        .from(users)
        .where(sql`${users.role} = 'admin' AND ${users.id} <> ${id}`);
      if ((admins as any[]).length === 0)
        return res.fail(400, { error: "cannot_demote_last_admin" });
    }

    await db.update(users).set({ role }).where(eq(users.id, id));
    return res.ok({ id, role });
  } catch (err) {
    next(err);
  }
});

export default router;
