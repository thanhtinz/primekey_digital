import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env file
const envPath = path.join(__dirname, ".env");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const envVars = {};
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length > 0) {
    envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const dbUrl = envVars.DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

console.log("Connecting to database...");
const conn = await mysql.createConnection(dbUrl);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`product_tags\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`name\` varchar(100) NOT NULL,
    \`slug\` varchar(100) NOT NULL,
    \`color\` varchar(20) DEFAULT '#3b82f6',
    \`createdAt_pt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`product_tags_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`product_tag_mappings\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`productId\` int NOT NULL,
    \`tagId\` int NOT NULL,
    CONSTRAINT \`product_tag_mappings_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("✓ Executed:", sql.slice(0, 60) + "...");
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠ Table already exists, skipping");
    } else {
      console.error("Error:", err.message);
    }
  }
}

await conn.end();
console.log("Done!");
