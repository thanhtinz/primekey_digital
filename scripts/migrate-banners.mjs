import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await createConnection(url);

try {
  // Add new Telegram notification columns to customers table
  const telegramCols = [
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notifyTelegramOrderPaid BOOLEAN DEFAULT TRUE",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notifyTelegramOrderShipping BOOLEAN DEFAULT TRUE",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notifyTelegramOrderCompleted BOOLEAN DEFAULT TRUE",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notifyTelegramWarranty BOOLEAN DEFAULT FALSE",
  ];
  
  for (const sql of telegramCols) {
    try {
      await conn.query(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Already exists (skip):', sql.substring(0, 60));
      } else {
        throw e;
      }
    }
  }

  // Create side_banners table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS side_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      position VARCHAR(10) NOT NULL,
      imageUrl TEXT NOT NULL,
      linkUrl VARCHAR(500),
      title VARCHAR(255),
      isActive BOOLEAN DEFAULT TRUE NOT NULL,
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
      updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('OK: side_banners table created/exists');

  // Create mini_banners table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS mini_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      imageUrl TEXT NOT NULL,
      linkUrl VARCHAR(500),
      title VARCHAR(255),
      isActive BOOLEAN DEFAULT TRUE NOT NULL,
      sortOrder INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
      updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('OK: mini_banners table created/exists');

  console.log('\nMigration completed successfully!');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await conn.end();
}
