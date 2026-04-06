import * as XLSX from "xlsx";

interface InvoiceRow {
  invoiceNumber: string;
  customerName: string;
  createdAt: Date | string;
  dueDate?: Date | string | null;
  status: string;
  currency: string;
  subtotal: number | string;
  taxAmount: number | string | null;
  discountAmount: number | string | null;
  totalAmount: number | string;
  notes?: string | null;
}

interface ReportData {
  invoices: InvoiceRow[];
  period: string;
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}

function formatCurrency(amount: number | string | null | undefined, currency = "VND"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
  if (currency === "USD") {
    return `$${num.toFixed(2)}`;
  }
  return `${num.toLocaleString("vi-VN")} ₫`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN");
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CREATED: "Tạo Đơn",
    PAID: "Đã Thanh Toán",
    FAILED: "Thất Bại",
    EXPIRED: "Hết Hạn",
  };
  return labels[status] || status;
}

export function generateInvoiceExcel(data: ReportData): Buffer {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["BÁO CÁO HÓA ĐƠN", ""],
    ["Kỳ báo cáo:", data.period],
    [""],
    ["TỔNG QUAN", ""],
    ["Tổng doanh thu:", formatCurrency(data.totalRevenue)],
    ["Tổng số hóa đơn:", data.totalInvoices],
    ["Đã thanh toán:", data.paidInvoices],
    ["Chờ thanh toán:", data.pendingInvoices],
    ["Tỷ lệ thanh toán:", data.totalInvoices > 0 ? `${Math.round((data.paidInvoices / data.totalInvoices) * 100)}%` : "0%"],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng Quan");

  // Invoices sheet
  const headers = [
    "Số Hóa Đơn",
    "Khách Hàng",
    "Ngày Tạo",
    "Hạn Thanh Toán",
    "Trạng Thái",
    "Tiền Tệ",
    "Tạm Tính",
    "Thuế",
    "Giảm Giá",
    "Tổng Cộng",
    "Ghi Chú",
  ];

  const rows = data.invoices.map((inv) => [
    inv.invoiceNumber,
    inv.customerName,
    formatDate(inv.createdAt),
    formatDate(inv.dueDate),
    getStatusLabel(inv.status),
    inv.currency || "VND",
    formatCurrency(inv.subtotal, inv.currency),
    formatCurrency(inv.taxAmount, inv.currency),
    formatCurrency(inv.discountAmount, inv.currency),
    formatCurrency(inv.totalAmount, inv.currency),
    inv.notes || "",
  ]);

  const wsInvoices = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsInvoices["!cols"] = [
    { wch: 15 }, // Số HĐ
    { wch: 25 }, // Khách hàng
    { wch: 12 }, // Ngày tạo
    { wch: 15 }, // Hạn TT
    { wch: 18 }, // Trạng thái
    { wch: 8 },  // Tiền tệ
    { wch: 18 }, // Tạm tính
    { wch: 15 }, // Thuế
    { wch: 15 }, // Giảm giá
    { wch: 18 }, // Tổng cộng
    { wch: 30 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, wsInvoices, "Danh Sách Hóa Đơn");

  // Write to buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}
