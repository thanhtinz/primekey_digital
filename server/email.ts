// Email helper functions
// This is a placeholder for email integration
// In production, you would use a service like SendGrid, Mailgun, or AWS SES

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Implement actual email sending
    // For now, we'll just log it
    console.log("[Email] Sending email to:", options.to);
    console.log("[Email] Subject:", options.subject);
    
    // In production, you would use:
    // - SendGrid: sgMail.send(msg)
    // - Mailgun: mg.messages.create()
    // - AWS SES: ses.sendEmail()
    // - Nodemailer: transporter.sendMail()
    
    return true;
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
