import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const conn = await mysql.createConnection(url);

try {
  // Apply the REFUNDED migration
  await conn.execute(`ALTER TABLE \`invoices\` MODIFY COLUMN \`status\` enum('CREATED','PAID','SHIPPING','WARRANTY','FAILED','EXPIRED','REFUNDED') DEFAULT 'CREATED'`);
  console.log("✅ Successfully added REFUNDED status to invoices table");
  
  // Mark migration as applied
  await conn.execute(`INSERT IGNORE INTO \`__drizzle_migrations\` (hash, created_at) VALUES ('0011_steady_fixer', ${Date.now()})`);
  console.log("✅ Migration marked as applied");
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await conn.end();
}
