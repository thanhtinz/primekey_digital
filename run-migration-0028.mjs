import { createConnection } from "mysql2/promise";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(dbUrl);

try {
  // Check if column exists
  const [rows] = await conn.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'inventoryType'"
  );
  
  if (rows.length > 0) {
    console.log("Column inventoryType already exists, skipping migration");
  } else {
    await conn.execute("ALTER TABLE `products` ADD `inventoryType` enum('manual','warehouse') DEFAULT 'manual' NOT NULL");
    console.log("Migration 0028: Added inventoryType column to products table");
  }
  
  // Also check product_inventory table
  const [rows2] = await conn.execute(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_inventory'"
  );
  if (rows2.length === 0) {
    await conn.execute(`CREATE TABLE \`product_inventory\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`productId\` int NOT NULL,
      \`packageId\` int,
      \`stockData\` text NOT NULL,
      \`status\` enum('available','used','reserved') DEFAULT 'available' NOT NULL,
      \`assignedOrderId\` int,
      \`assignedAt\` timestamp,
      \`createdAt\` timestamp DEFAULT (now()) NOT NULL
    )`);
    console.log("Created product_inventory table");
  } else {
    console.log("product_inventory table already exists");
  }
  
  // Also check static_pages table
  const [rows3] = await conn.execute(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'static_pages'"
  );
  if (rows3.length === 0) {
    await conn.execute(`CREATE TABLE \`static_pages\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`slug\` varchar(255) NOT NULL UNIQUE,
      \`title\` varchar(255) NOT NULL,
      \`content\` mediumtext,
      \`metaDescription\` text,
      \`isPublished\` tinyint DEFAULT 0 NOT NULL,
      \`createdAt\` timestamp DEFAULT (now()) NOT NULL,
      \`updatedAt\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log("Created static_pages table");
  } else {
    console.log("static_pages table already exists");
  }
  
  // Also check menu_items table
  const [rows4] = await conn.execute(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items'"
  );
  if (rows4.length === 0) {
    await conn.execute(`CREATE TABLE \`menu_items\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`label\` varchar(255) NOT NULL,
      \`url\` varchar(500) NOT NULL,
      \`parentId\` int,
      \`icon\` varchar(100),
      \`target\` varchar(20) DEFAULT '_self',
      \`order\` int DEFAULT 0 NOT NULL,
      \`isActive\` tinyint DEFAULT 1 NOT NULL,
      \`createdAt\` timestamp DEFAULT (now()) NOT NULL,
      \`updatedAt\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log("Created menu_items table");
  } else {
    console.log("menu_items table already exists");
  }
  
  console.log("All migrations done!");
} catch (err) {
  console.error("Migration error:", err.message);
} finally {
  await conn.end();
}
