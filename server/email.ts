// Email helper functions using Nodemailer
import * as nodemailer from "nodemailer";
import { getSmtpConfig } from "./db";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: number; // to look up SMTP config
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    let smtpCfg = null;
    if (options.userId) {
      smtpCfg = await getSmtpConfig(options.userId);
    }

    if (smtpCfg && smtpCfg.enabled && smtpCfg.host && smtpCfg.user && smtpCfg.password) {
      // Use configured SMTP
      const transporter = nodemailer.createTransport({
        host: smtpCfg.host,
        port: smtpCfg.port || 587,
        secure: smtpCfg.secure || false,
        auth: {
          user: smtpCfg.user,
          pass: smtpCfg.password,
        },
      });

      await transporter.sendMail({
        from: `"${smtpCfg.fromName || 'Invoice Prime'}" <${smtpCfg.fromEmail || smtpCfg.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      console.log("[Email] Sent via SMTP to:", options.to);
      return true;
    } else {
      // Log only (SMTP not configured)
      console.log("[Email] SMTP not configured. Would send to:", options.to, "Subject:", options.subject);
      return true; // Return true so app doesn't break
    }
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export function generateInvoiceEmailHTML(data: {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  paymentUrl?: string;
  companyName: string;
  trackUrl?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
          }
          .content {
            margin-bottom: 20px;
          }
          .invoice-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .invoice-details p {
            margin: 5px 0;
          }
          .amount {
            font-size: 24px;
            color: #28a745;
            font-weight: bold;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hóa Đơn Bán Hàng</h1>
            <p>${data.companyName}</p>
          </div>
          
          <div class="content">
            <p>Xin chào ${data.customerName},</p>
            <p>Chúng tôi gửi cho bạn hóa đơn bán hàng như sau:</p>
            
            <div class="invoice-details">
              <p><strong>Số hóa đơn:</strong> ${data.invoiceNumber}</p>
              <p><strong>Tổng tiền:</strong> <span class="amount">${data.totalAmount.toLocaleString("vi-VN")} ${data.currency}</span></p>
            </div>
            
            ${data.paymentUrl ? `
              <p>Vui lòng nhấp vào nút dưới đây để thanh toán:</p>
              <a href="${data.paymentUrl}" class="button">Thanh Toán Ngay</a>
            ` : ""}
            
            <p>Bạn có thể theo dõi trạng thái đơn hàng tại: <a href="${data.trackUrl || '#'}" style="color:#007bff">Theo Dõi Đơn Hàng</a></p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Cảm ơn bạn!</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.companyName}. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateStatusUpdateEmailHTML(data: {
  invoiceNumber: string;
  customerName: string;
  status: string;
  statusLabel: string;
  companyName: string;
  reviewUrl?: string;
  trackUrl?: string;
}): string {
  const statusColors: Record<string, string> = {
    CREATED: "#3B82F6",
    PAID: "#10B981",
    SHIPPING: "#F59E0B",
    WARRANTY: "#8B5CF6",
    FAILED: "#EF4444",
    EXPIRED: "#6B7280",
  };
  const color = statusColors[data.status] || "#3B82F6";
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; }
        .header { text-align: center; border-bottom: 2px solid ${color}; padding-bottom: 20px; margin-bottom: 20px; }
        .status-badge { display: inline-block; background: ${color}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color:${color}">Cập Nhật Đơn Hàng</h1>
            <div class="status-badge">${data.statusLabel}</div>
          </div>
          <p>Xin chào <strong>${data.customerName}</strong>,</p>
          <p>Đơn hàng <strong>${data.invoiceNumber}</strong> của bạn đã được cập nhật trạng thái: <strong>${data.statusLabel}</strong></p>
          ${data.trackUrl ? `<p>Theo dõi trạng thái đơn hàng: <a href="${data.trackUrl}" style="color:${color}">Xem Đơn Hàng</a></p>` : ""}
          ${data.reviewUrl ? `<p style="margin-top:20px">Bạn có thể đánh giá đơn hàng tại: <a href="${data.reviewUrl}" style="color:${color}">Đánh Giá Ngay</a></p>` : ""}
          <p>Cảm ơn bạn đã tin tưởng ${data.companyName}!</p>
          <div class="footer"><p>© ${new Date().getFullYear()} ${data.companyName}</p></div>
        </div>
      </body>
    </html>
  `;
}

export function generatePaymentConfirmationEmailHTML(data: {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  paidAt: Date;
  companyName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #28a745;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #28a745;
            margin: 0;
          }
          .success-badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            margin-top: 10px;
          }
          .content {
            margin-bottom: 20px;
          }
          .details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .details p {
            margin: 5px 0;
          }
          .amount {
            font-size: 24px;
            color: #28a745;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thanh Toán Thành Công</h1>
            <div class="success-badge">✓ Xác Nhận Thanh Toán</div>
          </div>
          
          <div class="content">
            <p>Xin chào ${data.customerName},</p>
            <p>Chúng tôi xác nhận rằng thanh toán của bạn đã được nhận thành công.</p>
            
            <div class="details">
              <p><strong>Số hóa đơn:</strong> ${data.invoiceNumber}</p>
              <p><strong>Số tiền:</strong> <span class="amount">${data.totalAmount.toLocaleString("vi-VN")} ${data.currency}</span></p>
              <p><strong>Ngày thanh toán:</strong> ${new Date(data.paidAt).toLocaleDateString("vi-VN")}</p>
            </div>
            
            <p>Cảm ơn bạn đã thanh toán. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.companyName}. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
