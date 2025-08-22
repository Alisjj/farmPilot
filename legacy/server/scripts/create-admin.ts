import "dotenv/config";
import bcrypt from "bcrypt";
import { Client } from "pg";

async function main() {
    const email = process.argv[2] || "admin@example.com";
    const password = process.argv[3] || "AdminPass123";
    const firstName = process.argv[4] || "Admin";
    const lastName = process.argv[5] || "User";

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not set");
        process.exit(1);
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const hash = await bcrypt.hash(password, 10);
        await client.query(
            `INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1,$2,'admin',$3,$4)
       ON CONFLICT (email) DO UPDATE SET role='admin', first_name=$3, last_name=$4`,
            [email, hash, firstName, lastName]
        );
        console.log(`Admin ensured: ${email}`);
    } catch (e: any) {
        console.error("Failed to create admin:", e.message);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main();
