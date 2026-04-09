import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('DATABASE_URL not set'); process.exit(1); }

const url = new URL(dbUrl);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`site_announcements\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`title\` varchar(200) NOT NULL,
    \`content\` text NOT NULL,
    \`sa_type\` enum('info','success','warning','error') DEFAULT 'info',
    \`isActive\` boolean DEFAULT true,
    \`showAsPopup\` boolean DEFAULT false,
    \`startAt\` timestamp NOT NULL DEFAULT (now()),
    \`endAt\` timestamp NULL,
    \`createdAt_sa\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`site_announcements_id\` PRIMARY KEY(\`id\`)
  )`,
];

console.log('Connecting to database...');
for (const sql of sqls) {
  await conn.execute(sql);
  console.log('✓ Executed:', sql.slice(0, 60) + '...');
}
await conn.end();
console.log('Done!');
