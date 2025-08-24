import db from "../src/db";
import bcrypt from "bcrypt";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "password";
  const hash = await bcrypt.hash(password, 10);
  // Upsert admin: if username exists, update role and password
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, email));
  if ((existing as any[]).length > 0) {
    const u = (existing as any[])[0];
    await db
      .update(users)
      .set({ password_hash: hash, role: "admin", is_active: true })
      .where(eq(users.id, u.id));
    console.log("Updated existing admin user", email);
    return;
  }
  await db
    .insert(users)
    .values({
      username: email,
      password_hash: hash,
      role: "admin",
      full_name: "Administrator",
    });
  console.log("Created admin user", email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
