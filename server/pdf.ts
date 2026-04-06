import puppeteer from "puppeteer-core";

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerTaxId?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    totalAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  footerText?: string;
  accentColor?: string;
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === "VND") {
    return amount.toLocaleString("vi-VN") + " ₫";
  }
  return amount.toLocaleString("vi-VN") + " " + currency;
}

function buildInvoiceHTML(data: InvoiceData): string {
  const accent = data.accentColor || "#2563eb";
  const issueDate = new Date(data.issueDate).toLocaleDateString("vi-VN");
  const dueDate = data.dueDate ? new Date(data.dueDate).toLocaleDateString("vi-VN") : null;

  const itemRows = data.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(item.unitPrice, data.currency)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(item.totalAmount, data.currency)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #ffffff;
    padding: 40px;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 3px solid ${accent};
  }
  .company-name {
    font-size: 22px;
    font-weight: 700;
    color: ${accent};
    margin-bottom: 4px;
  }
  .company-info { font-size: 12px; color: #64748b; line-height: 1.6; }
  .invoice-title {
    text-align: right;
  }
  .invoice-title h1 {
    font-size: 28px;
    font-weight: 700;
    color: ${accent};
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .invoice-number {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .meta-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e2e8f0;
  }
  .meta-box-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .meta-box-value { font-weight: 600; font-size: 13px; color: #1e293b; }
  .meta-box-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  .customer-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 28px;
    border: 1px solid #e2e8f0;
  }
  .customer-section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .customer-name { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .customer-detail { font-size: 12px; color: #64748b; margin-top: 2px; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  thead tr {
    background: ${accent};
    color: white;
  }
  thead th {
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  thead th:not(:first-child) { text-align: right; }
  thead th:nth-child(2) { text-align: center; }
  .totals {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }
  .totals-box {
    width: 280px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
  }
  .totals-row:last-child { border-bottom: none; }
  .totals-row.total-final {
    background: ${accent};
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 12px 16px;
  }
  .totals-label { color: #64748b; }
  .totals-row.total-final .totals-label { color: rgba(255,255,255,0.85); }
  .notes-section {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 24px;
  }
  .notes-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #92400e;
    margin-bottom: 6px;
  }
  .notes-text { font-size: 12px; color: #78350f; line-height: 1.6; }
  .footer {
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${data.companyName}</div>
      <div class="company-info">
        ${data.companyAddress ? `<div>📍 ${data.companyAddress}</div>` : ""}
        ${data.companyPhone ? `<div>📞 ${data.companyPhone}</div>` : ""}
        ${data.companyEmail ? `<div>✉️ ${data.companyEmail}</div>` : ""}
        ${data.companyTaxId ? `<div>MST: ${data.companyTaxId}</div>` : ""}
      </div>
    </div>
    <div class="invoice-title">
      <h1>HÓA ĐƠN</h1>
      <div class="invoice-number">${data.invoiceNumber}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-box-title">Ngày phát hành</div>
      <div class="meta-box-value">${issueDate}</div>
    </div>
    ${dueDate ? `
    <div class="meta-box">
      <div class="meta-box-title">Hạn thanh toán</div>
      <div class="meta-box-value" style="color:#dc2626;">${dueDate}</div>
    </div>
    ` : ""}
  </div>

  <div class="customer-section">
    <div class="customer-section-title">Thông tin khách hàng</div>
    <div class="customer-name">${data.customerName}</div>
    ${data.customerEmail ? `<div class="customer-detail">✉️ ${data.customerEmail}</div>` : ""}
    ${data.customerAddress ? `<div class="customer-detail">📍 ${data.customerAddress}</div>` : ""}
    ${data.customerTaxId ? `<div class="customer-detail">MST: ${data.customerTaxId}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:45%">Mô tả sản phẩm / dịch vụ</th>
        <th style="width:12%">Số lượng</th>
        <th style="width:20%">Đơn giá</th>
        <th style="width:23%">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Cộng tiền hàng</span>
        <span>${formatCurrency(data.subtotal, data.currency)}</span>
      </div>
      ${data.taxAmount > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Thuế VAT</span>
        <span>${formatCurrency(data.taxAmount, data.currency)}</span>
      </div>` : ""}
      ${data.discountAmount > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Chiết khấu</span>
        <span style="color:#16a34a;">-${formatCurrency(data.discountAmount, data.currency)}</span>
      </div>` : ""}
      <div class="totals-row total-final">
        <span class="totals-label">TỔNG CỘNG</span>
        <span>${formatCurrency(data.totalAmount, data.currency)}</span>
      </div>
    </div>
  </div>

  ${data.notes ? `
  <div class="notes-section">
    <div class="notes-title">Ghi chú</div>
    <div class="notes-text">${data.notes}</div>
  </div>
  ` : ""}

  ${data.footerText ? `
  <div class="footer">${data.footerText}</div>
  ` : `
  <div class="footer">Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ của chúng tôi.</div>
  `}
</body>
</html>`;
}

let browserInstance: any = null;

async function getBrowser() {
  if (!browserInstance) {
    const puppeteer = await import("puppeteer-core");
    browserInstance = await puppeteer.default.launch({
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
      headless: true,
    });
  }
  return browserInstance;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = buildInvoiceHTML(data);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
