import { createConnection } from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(url);
try {
  await conn.execute(`
    ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS emailVerificationToken VARCHAR(128) NULL
  `);
  console.log("Added emailVerificationToken column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("Column already exists");
  } else {
    console.error("Error:", e.message);
  }
}
await conn.end();
