import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await conn.execute(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS orderInfo TEXT COMMENT 'JSON: custom field values'`);
  console.log("✓ Added orderInfo column to invoices table");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("Column already exists, skipping");
  } else {
    console.error("Error:", e.message);
  }
}

await conn.end();
