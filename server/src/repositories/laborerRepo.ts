import { db } from "../db";
import { laborers } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export async function listLaborers(limit = 100, offset = 0) {
  return db.select().from(laborers).limit(limit).offset(offset);
}

export async function findLaborerById(id: number) {
  return db.select().from(laborers).where(eq(laborers.id, id)).limit(1);
}

export async function insertLaborer(row: any) {
  return db.insert(laborers).values(row).returning();
}

export async function updateLaborer(id: number, data: any) {
  return db.update(laborers).set(data).where(eq(laborers.id, id)).returning();
}

export async function deleteLaborer(id: number) {
  return db.delete(laborers).where(eq(laborers.id, id)).returning();
}
