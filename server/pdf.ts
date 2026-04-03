import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  // Header
  doc.setFontSize(20);
  doc.text("HÓA ĐƠN BÁN HÀNG", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Company info
  doc.setFontSize(10);
  doc.text(`${data.companyName}`, 10, yPosition);
  yPosition += 5;
  if (data.companyAddress) {
    doc.text(`Địa chỉ: ${data.companyAddress}`, 10, yPosition);
    yPosition += 5;
  }
  if (data.companyPhone) {
    doc.text(`ĐT: ${data.companyPhone}`, 10, yPosition);
    yPosition += 5;
  }
  if (data.companyEmail) {
    doc.text(`Email: ${data.companyEmail}`, 10, yPosition);
    yPosition += 5;
  }
  if (data.companyTaxId) {
    doc.text(`MST: ${data.companyTaxId}`, 10, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Invoice details
  doc.setFontSize(9);
  doc.text(`Số hóa đơn: ${data.invoiceNumber}`, 10, yPosition);
  yPosition += 5;
  doc.text(`Ngày phát hành: ${new Date(data.issueDate).toLocaleDateString("vi-VN")}`, 10, yPosition);
  yPosition += 5;
  if (data.dueDate) {
    doc.text(`Hạn thanh toán: ${new Date(data.dueDate).toLocaleDateString("vi-VN")}`, 10, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Customer info
  doc.setFontSize(10);
  doc.text("KHÁCH HÀNG:", 10, yPosition);
  yPosition += 5;
  doc.setFontSize(9);
  doc.text(`${data.customerName}`, 10, yPosition);
  yPosition += 4;
  if (data.customerAddress) {
    doc.text(`Địa chỉ: ${data.customerAddress}`, 10, yPosition);
    yPosition += 4;
  }
  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, 10, yPosition);
    yPosition += 4;
  }
  if (data.customerTaxId) {
    doc.text(`MST: ${data.customerTaxId}`, 10, yPosition);
    yPosition += 4;
  }

  yPosition += 5;

  // Items table
  const tableData = data.items.map(item => [
    item.name,
    item.quantity.toString(),
    item.unitPrice.toLocaleString("vi-VN"),
    item.totalAmount.toLocaleString("vi-VN"),
  ]);

  (doc as any).autoTable({
    head: [["Mô tả", "Số lượng", "Đơn giá", "Thành tiền"]],
    body: tableData,
    startY: yPosition,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(9);
  doc.text(`Cộng tiền hàng: ${data.subtotal.toLocaleString("vi-VN")} ${data.currency}`, pageWidth - 60, yPosition);
  yPosition += 5;
  if (data.taxAmount > 0) {
    doc.text(`Thuế GTGT: ${data.taxAmount.toLocaleString("vi-VN")} ${data.currency}`, pageWidth - 60, yPosition);
    yPosition += 5;
  }
  if (data.discountAmount > 0) {
    doc.text(`Chiết khấu: ${data.discountAmount.toLocaleString("vi-VN")} ${data.currency}`, pageWidth - 60, yPosition);
    yPosition += 5;
  }
  doc.setFontSize(11);
  doc.text(`Tổng cộng: ${data.totalAmount.toLocaleString("vi-VN")} ${data.currency}`, pageWidth - 60, yPosition);

  yPosition += 10;

  // Notes
  if (data.notes) {
    doc.setFontSize(9);
    doc.text("Ghi chú:", 10, yPosition);
    yPosition += 5;
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 20);
    doc.text(noteLines, 10, yPosition);
    yPosition += noteLines.length * 4 + 5;
  }

  // Footer
  if (data.footerText) {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(data.footerText, pageWidth / 2, pageHeight - 10, { align: "center" } as any);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
