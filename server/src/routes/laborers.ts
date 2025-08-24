import { Router } from "express";
import { z } from "zod";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { LaborerCreateDTO, LaborerUpdateDTO } from "../types/dtos";
import { LaborerService } from "../services/laborerService";

const router = Router();

const createSchema = z.object({
  employee_id: z.string().optional(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  monthly_salary: z.number().min(0),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.boolean().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.get("/", isAuthenticated, async (req, res) => {
  const rows = await LaborerService.list(1000, 0);
  res.json({ laborers: rows });
});

router.get("/:id", isAuthenticated, async (req, res) => {
  const id = Number(req.params.id);
  const row = await LaborerService.get(id);
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json(row);
});

router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const payload = throwIfInvalid(
      createSchema.safeParse(req.body)
    ) as LaborerCreateDTO;
    const row = await LaborerService.create(payload);
    res.status(201).json({ message: "Laborer created", laborer: row });
  }
);

router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const id = Number(req.params.id);
    const payload = throwIfInvalid(
      updateSchema.safeParse(req.body)
    ) as LaborerUpdateDTO;
    const row = await LaborerService.update(id, payload);
    res.json({ message: "Laborer updated", laborer: row });
  }
);

router.delete(
  "/:id",
  isAuthenticated,
  authorize(["owner"]),
  async (req, res) => {
    const id = Number(req.params.id);
    await LaborerService.remove(id);
    res.json({ message: "deleted" });
  }
);

export default router;
