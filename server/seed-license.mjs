/**
 * Seed License Script
 * Tạo giấy phép vĩnh viễn cho website
 * Chạy: node server/seed-license.mjs
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

async function seedLicense() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL không được cấu hình');
      process.exit(1);
    }

    const connection = await mysql.createConnection(dbUrl);

    const domain = process.env.APP_DOMAIN || '3000-iwdwaame88gtvd1921m0o-b2ab13a3.us2.manus.computer';
    const email = 'thanhtinz23072003@gmail.com';
    const licenseKey = '787DC-275FA-069D7-B13C0-37124';

    // Kiểm tra xem userSettings đã tồn tại chưa
    const [rows] = await connection.execute('SELECT id FROM userSettings WHERE id = 1');

    if (rows.length === 0) {
      // Tạo mới
      const insertQuery = `
        INSERT INTO userSettings (
          userId, licenseActivated, licenseKey, licenseEmail, 
          licenseActivatedAt, licenseExpiresAt, licensePlan, licenseDomain, licenseOwner
        ) VALUES (1, 1, '${licenseKey}', '${email}', NOW(), '2099-12-31 23:59:59', 'premium', '${domain}', 'PrimeShop')
      `;
      await connection.execute(insertQuery);
      console.log('✅ Tạo mới giấy phép thành công!');
    } else {
      // Cập nhật
      const updateQuery = `
        UPDATE userSettings SET
          licenseActivated = 1,
          licenseKey = '${licenseKey}',
          licenseEmail = '${email}',
          licenseActivatedAt = NOW(),
          licenseExpiresAt = '2099-12-31 23:59:59',
          licensePlan = 'premium',
          licenseDomain = '${domain}',
          licenseOwner = 'PrimeShop'
        WHERE id = 1
      `;
      await connection.execute(updateQuery);
      console.log('✅ Cập nhật giấy phép thành công!');
    }

    console.log('\n📋 Thông tin giấy phép:');
    console.log('  License Key:', licenseKey);
    console.log('  Email:', email);
    console.log('  Domain:', domain);
    console.log('  Hết hạn: 2099-12-31 (vĩnh viễn)');
    console.log('  Ghi chú: Giấy phép này chỉ dùng cho website hiện tại\n');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedLicense();
