import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema.ts";

// Load env
import { config } from "dotenv";
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Xóa toàn bộ users
console.log("Deleting all users...");
await db.delete(users);
console.log("All users deleted.");

// Tạo admin mới
const hashedPassword = await bcrypt.hash("tinklh", 10);
await db.insert(users).values({
  email: "tinklh@invoiceprime.com",
  password: hashedPassword,
  name: "tinklh",
  role: "admin",
});
console.log("Admin user created: tinklh / tinklh");

await connection.end();
process.exit(0);
