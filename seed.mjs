import bcrypt from "bcryptjs";
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  console.log("Connecting to database...");
  const conn = await createConnection(DATABASE_URL);

  const SALT_ROUNDS = 10;

  // Hash passwords
  const adminHash = await bcrypt.hash("tinklh", SALT_ROUNDS);
  const staffHash = await bcrypt.hash("1", SALT_ROUNDS);

  // Check if admin exists
  const [adminRows] = await conn.execute(
    "SELECT id FROM users WHERE email = ?",
    ["tinklh"]
  );

  if (adminRows.length === 0) {
    await conn.execute(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["tinklh", adminHash, "Admin (tinklh)", "admin"]
    );
    console.log("✅ Created admin account: tinklh / tinklh");
  } else {
    // Update password in case it changed
    await conn.execute(
      "UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?",
      [adminHash, "Admin (tinklh)", "admin", "tinklh"]
    );
    console.log("✅ Updated admin account: tinklh / tinklh");
  }

  // Check if staff exists
  const [staffRows] = await conn.execute(
    "SELECT id FROM users WHERE email = ?",
    ["nhanvien"]
  );

  if (staffRows.length === 0) {
    await conn.execute(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ["nhanvien", staffHash, "Nhân Viên", "user"]
    );
    console.log("✅ Created staff account: nhanvien / 1");
  } else {
    await conn.execute(
      "UPDATE users SET password = ?, name = ?, role = ? WHERE email = ?",
      [staffHash, "Nhân Viên", "user", "nhanvien"]
    );
    console.log("✅ Updated staff account: nhanvien / 1");
  }

  await conn.end();
  console.log("✅ Seed completed!");
}

seed().catch(console.error);
