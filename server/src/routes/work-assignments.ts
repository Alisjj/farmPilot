import { Router } from "express";
import { z } from "zod";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { throwIfInvalid } from "../lib/validation";
import { WorkAssignmentService } from "../services/workAssignmentService";

const router = Router();

const createSchema = z.object({
  laborer_id: z.number().int().positive(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().min(0),
  task: z.string().min(1),
  supervisor_id: z.number().optional(),
  present: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

router.get("/", isAuthenticated, async (req, res) => {
  const rows = await WorkAssignmentService.list(1000, 0);
  res.json({ assignments: rows });
});

router.get("/date/:date", isAuthenticated, async (req, res) => {
  const date = req.params.date;
  const rows = await WorkAssignmentService.byDate(date);
  res.json({ assignments: rows });
});

router.post(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const payload = throwIfInvalid(createSchema.safeParse(req.body));
    const row = await WorkAssignmentService.create(payload as any);
    res.status(201).json({ assignment: row });
  }
);

router.put(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const id = Number(req.params.id);
    const payload = throwIfInvalid(updateSchema.safeParse(req.body));
    const row = await WorkAssignmentService.update(id, payload as any);
    res.json({ assignment: row });
  }
);

router.delete(
  "/:id",
  isAuthenticated,
  authorize(["owner"]),
  async (req, res) => {
    const id = Number(req.params.id);
    await WorkAssignmentService.remove(id);
    res.json({ deleted: true });
  }
);

export default router;
