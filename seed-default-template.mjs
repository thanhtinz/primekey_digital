/**
 * Script seed mẫu hóa đơn mặc định cho hệ thống Invoice Prime
 * Chạy: node seed-default-template.mjs
 */
import { createConnection } from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL không tồn tại trong environment");
  process.exit(1);
}

async function main() {
  console.log("Kết nối database...");
  const conn = await createConnection(DATABASE_URL);

  try {
    // Lấy user admin
    const [users] = await conn.execute(
      "SELECT id, email, name FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (!users.length) {
      console.error("Không tìm thấy user admin");
      process.exit(1);
    }
    const adminUser = users[0];
    console.log("Tìm thấy admin: " + adminUser.email + " (id=" + adminUser.id + ")");

    // Kiểm tra đã có mẫu mặc định chưa
    const [existing] = await conn.execute(
      "SELECT id, name FROM invoiceTemplates WHERE userId = ? AND isDefault = 1 LIMIT 1",
      [adminUser.id]
    );
    if (existing.length > 0) {
      console.log("Đã có mẫu mặc định: " + existing[0].name + " (id=" + existing[0].id + ")");
      console.log("Đặt lại isDefault = 0 cho tất cả và tạo mẫu mới...");
      await conn.execute(
        "UPDATE invoiceTemplates SET isDefault = 0 WHERE userId = ?",
        [adminUser.id]
      );
    }

    // Tạo 3 mẫu hóa đơn đẹp
    const templates = [
      {
        name: "Chuyên Nghiệp - Xanh Dương",
        companyName: "Công Ty TNHH Invoice Prime",
        companyAddress: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        companyPhone: "0901 234 567",
        companyEmail: "contact@invoiceprime.vn",
        companyTaxCode: "0123456789",
        logo: null,
        invoiceTitle: "HÓA ĐƠN BÁN HÀNG",
        footer: "Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!\nMọi thắc mắc xin liên hệ: 0901 234 567 | contact@invoiceprime.vn",
        headerColor: "#1e40af",
        accentColor: "#3b82f6",
        textColor: "#111827",
        bgColor: "#ffffff",
        fontFamily: "Arial",
        showLogo: 1,
        showTaxCode: 1,
        showBankInfo: 1,
        bankInfo: "Ngân hàng: Vietcombank\nSố tài khoản: 1234567890\nChủ tài khoản: CÔNG TY TNHH INVOICE PRIME\nChi nhánh: TP. Hồ Chí Minh",
        notes: "Hàng hóa/dịch vụ đã bao gồm VAT. Vui lòng thanh toán đúng hạn.",
        isDefault: 1,
      },
      {
        name: "Hiện Đại - Xanh Lá",
        companyName: "Công Ty TNHH Invoice Prime",
        companyAddress: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        companyPhone: "0901 234 567",
        companyEmail: "contact@invoiceprime.vn",
        companyTaxCode: "0123456789",
        logo: null,
        invoiceTitle: "HÓA ĐƠN THANH TOÁN",
        footer: "Xin chân thành cảm ơn quý khách hàng!\nLiên hệ hỗ trợ: 0901 234 567",
        headerColor: "#065f46",
        accentColor: "#10b981",
        textColor: "#111827",
        bgColor: "#ffffff",
        fontFamily: "Arial",
        showLogo: 1,
        showTaxCode: 1,
        showBankInfo: 1,
        bankInfo: "Ngân hàng: Techcombank\nSố tài khoản: 9876543210\nChủ tài khoản: CÔNG TY TNHH INVOICE PRIME\nChi nhánh: TP. Hồ Chí Minh",
        notes: "Giá đã bao gồm thuế VAT 10%. Hóa đơn có giá trị trong 30 ngày.",
        isDefault: 0,
      },
      {
        name: "Sang Trọng - Tím",
        companyName: "Công Ty TNHH Invoice Prime",
        companyAddress: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        companyPhone: "0901 234 567",
        companyEmail: "contact@invoiceprime.vn",
        companyTaxCode: "0123456789",
        logo: null,
        invoiceTitle: "PHIẾU THU TIỀN",
        footer: "Trân trọng cảm ơn sự hợp tác của quý khách!\nHotline: 0901 234 567 | Email: contact@invoiceprime.vn",
        headerColor: "#4c1d95",
        accentColor: "#8b5cf6",
        textColor: "#111827",
        bgColor: "#ffffff",
        fontFamily: "Arial",
        showLogo: 1,
        showTaxCode: 0,
        showBankInfo: 1,
        bankInfo: "Ngân hàng: MB Bank\nSố tài khoản: 5555666677\nChủ tài khoản: CÔNG TY TNHH INVOICE PRIME\nChi nhánh: TP. Hồ Chí Minh",
        notes: "Vui lòng giữ hóa đơn để đối chiếu khi cần thiết.",
        isDefault: 0,
      },
    ];

    for (const tpl of templates) {
      const [result] = await conn.execute(
        `INSERT INTO invoiceTemplates 
          (userId, name, companyName, companyAddress, companyPhone, companyEmail, companyTaxCode,
           logo, invoiceTitle, footer, headerColor, accentColor, textColor, bgColor, fontFamily,
           showLogo, showTaxCode, showBankInfo, bankInfo, notes, isDefault, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          adminUser.id, tpl.name, tpl.companyName, tpl.companyAddress, tpl.companyPhone,
          tpl.companyEmail, tpl.companyTaxCode, tpl.logo, tpl.invoiceTitle, tpl.footer,
          tpl.headerColor, tpl.accentColor, tpl.textColor, tpl.bgColor, tpl.fontFamily,
          tpl.showLogo, tpl.showTaxCode, tpl.showBankInfo,
          tpl.bankInfo, tpl.notes, tpl.isDefault,
        ]
      );
      const insertId = result.insertId;
      const defaultMark = tpl.isDefault ? " [MAC DINH]" : "";
      console.log("Tao mau: " + tpl.name + " (id=" + insertId + ")" + defaultMark);
    }

    // Xác nhận kết quả
    const [allTemplates] = await conn.execute(
      "SELECT id, name, isDefault, headerColor FROM invoiceTemplates WHERE userId = ? ORDER BY isDefault DESC, id ASC",
      [adminUser.id]
    );
    console.log("\nDanh sach mau hoa don:");
    for (const t of allTemplates) {
      const mark = t.isDefault ? "[*]" : "   ";
      console.log("  " + mark + " [" + t.id + "] " + t.name + " (" + t.headerColor + ")");
    }
    console.log("\nSeed hoan thanh!");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Loi:", err.message);
  process.exit(1);
});
