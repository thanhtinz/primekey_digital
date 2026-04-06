import { createConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
try {
  const envPath = join(__dirname, "../.env");
  const envContent = readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  });
} catch {}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

async function main() {
  const conn = await createConnection(DATABASE_URL);
  
  const users = [
    {
      email: "tinklh@invoiceprime.com",
      password: "tinklh",
      name: "Tinklh (Admin)",
      role: "admin",
    },
    {
      email: "nhanvien@invoiceprime.com",
      password: "1",
      name: "Nhân Viên",
      role: "user",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    // Check if user exists
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [user.email]
    );
    
    if (existing.length > 0) {
      // Update password and role
      await conn.execute(
        "UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?",
        [hashedPassword, user.name, user.role, user.email]
      );
      console.log(`Updated user: ${user.email} (role: ${user.role})`);
    } else {
      // Create new user
      await conn.execute(
        "INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [user.email, hashedPassword, user.name, user.role]
      );
      console.log(`Created user: ${user.email} (role: ${user.role})`);
    }
  }

  console.log("\nSeed completed!");
  console.log("Admin: tinklh@invoiceprime.com / tinklh");
  console.log("Staff: nhanvien@invoiceprime.com / 1");
  
  await conn.end();
}

main().catch(console.error);
