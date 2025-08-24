import * as payrollRepo from "../repositories/payrollRepo";
import * as laborerRepo from "../repositories/laborerRepo";
import * as assignmentRepo from "../repositories/workAssignmentRepo";
import { PayrollCreateDTO } from "../types/dtos";

export const PayrollService = {
  async list(limit = 100, offset = 0) {
    return payrollRepo.listPayrolls(limit, offset);
  },

  async get(id: number) {
    const rows = await payrollRepo.findPayrollById(id);
    return rows[0] || null;
  },

  async create(payload: PayrollCreateDTO) {
    const res = await payrollRepo.insertPayroll(payload as any);
    return res[0];
  },

  // Generate payroll for a month (YYYY-MM) - simple algorithm:
  // base_salary = daily_rate * number_of_days_present (count of present assignments in that month)
  async generate(monthYear: string) {
    // list all laborers
    const laborers = await laborerRepo.listLaborers(1000, 0);

    const results: any[] = [];

    for (const l of laborers) {
      const laborerId = l.id;

      // fetch assignments and filter those for this laborer and month
      const assignments = await assignmentRepo.listWorkAssignments(1000, 0);
      const laborerAssigns = assignments.filter((a: any) => {
        return (
          a.laborer_id === laborerId &&
          a.work_date &&
          a.work_date.startsWith(monthYear)
        );
      });

      let daysWorked = 0;
      let daysAbsent = 0;
      for (const a of laborerAssigns) {
        const status = a.attendance_status || "present";
        if (status === "present") daysWorked += 1;
        else if (status === "half_day") daysWorked += 0.5;
        else if (status === "late") daysWorked += 0.75;
        else if (status === "absent") daysAbsent += 1;
      }

      const monthlySalary = Number(l.monthly_salary || 0);
      // approximate final salary proportional to daysWorked / daysInMonth
      const [y, m] = monthYear.split("-").map(Number);
      const daysInMon = new Date(Number(y), Number(m), 0).getDate();
      const baseSalary =
        daysInMon > 0 ? monthlySalary * (daysWorked / daysInMon) : 0;

      const deductions = 0; // placeholder for deduction rules
      const bonuses = 0; // placeholder for bonuses
      const finalSalary = baseSalary + bonuses - deductions;

      const payrollRow = {
        month_year: monthYear + "-01",
        laborer_id: laborerId,
        base_salary: baseSalary,
        days_worked: Math.round(daysWorked * 100) / 100,
        days_absent: Math.round(daysAbsent * 100) / 100,
        salary_deductions: deductions,
        bonus_amount: bonuses,
        final_salary: finalSalary,
        payment_status: "pending",
      };

      const existing = await payrollRepo.findPayrollByMonthLaborer(
        monthYear + "-01",
        laborerId
      );
      if (existing.length > 0) {
        // update
        await payrollRepo.updatePayroll(existing[0].id, payrollRow);
        results.push({ laborer_id: laborerId, updated: true });
      } else {
        await payrollRepo.insertPayroll(payrollRow);
        results.push({ laborer_id: laborerId, created: true });
      }
    }

    return results;
  },
};
