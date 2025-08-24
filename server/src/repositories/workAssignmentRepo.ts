import { db } from "../db";
import { daily_work_assignments } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export async function listWorkAssignments(limit = 100, offset = 0) {
  return db.select().from(daily_work_assignments).limit(limit).offset(offset);
}

export async function findWorkAssignmentsByDate(date: string) {
  return db
    .select()
    .from(daily_work_assignments)
    .where(eq(daily_work_assignments.work_date, date));
}

export async function insertWorkAssignment(row: any) {
  return db.insert(daily_work_assignments).values(row).returning();
}

export async function updateWorkAssignment(id: number, data: any) {
  return db
    .update(daily_work_assignments)
    .set(data)
    .where(eq(daily_work_assignments.id, id))
    .returning();
}

export async function deleteWorkAssignment(id: number) {
  return db
    .delete(daily_work_assignments)
    .where(eq(daily_work_assignments.id, id))
    .returning();
}
