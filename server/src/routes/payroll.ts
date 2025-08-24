import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { authorize } from "../middleware/authorize";
import { PayrollService } from "../services/payrollService";

const router = Router();

router.get(
  "/",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const rows = await PayrollService.list(1000, 0);
    res.json({ payrolls: rows });
  }
);

router.get(
  "/:id",
  isAuthenticated,
  authorize(["owner", "supervisor"]),
  async (req, res) => {
    const id = Number(req.params.id);
    const row = await PayrollService.get(id);
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  }
);

router.post("/", isAuthenticated, authorize(["owner"]), async (req, res) => {
  const row = await PayrollService.create(req.body as any);
  res.status(201).json(row);
});

// Generate payroll for a given month (YYYY-MM)
router.post(
  "/generate/:month",
  isAuthenticated,
  authorize(["owner"]),
  async (req, res) => {
    const month = req.params.month;
    const result = await PayrollService.generate(month);
    res.json({ result });
  }
);

export default router;
