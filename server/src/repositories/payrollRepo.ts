import { db } from "../db";
import { monthly_payroll } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export async function listPayrolls(limit = 100, offset = 0) {
  return db.select().from(monthly_payroll).limit(limit).offset(offset);
}

export async function findPayrollById(id: number) {
  return db
    .select()
    .from(monthly_payroll)
    .where(eq(monthly_payroll.id, id))
    .limit(1);
}

export async function findPayrollByMonthLaborer(
  month: string,
  laborerId: number
) {
  return db
    .select()
    .from(monthly_payroll)
    .where(
      eq(monthly_payroll.month_year, month),
      eq(monthly_payroll.laborer_id, laborerId)
    )
    .limit(1);
}

export async function insertPayroll(row: any) {
  return db.insert(monthly_payroll).values(row).returning();
}

export async function updatePayroll(id: number, data: any) {
  return db
    .update(monthly_payroll)
    .set(data)
    .where(eq(monthly_payroll.id, id))
    .returning();
}
