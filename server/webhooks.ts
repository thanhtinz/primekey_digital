import crypto from "crypto";
import { Router } from "express";
import * as db from "./db";
import { sendEmail, generatePaymentConfirmationEmailHTML } from "./email";

const router = Router();

/**
 * Verify PayOS webhook signature
 * PayOS computes signature from sorted key=value pairs of the data object
 */
function verifyPayOSWebhookSignature(data: any, checksumKey: string, receivedSignature: string): boolean {
  try {
    const sortedKeys = Object.keys(data).sort();
    const dataString = sortedKeys.map(key => `${key}=${data[key]}`).join("&");
    const expectedSignature = crypto
      .createHmac("sha256", checksumKey)
      .update(dataString)
      .digest("hex");
    return expectedSignature === receivedSignature;
  } catch (e) {
    return false;
  }
}

// PayOS Webhook Handler
router.post("/payos", async (req, res) => {
  // Always respond 200 quickly to PayOS to avoid retries
  res.json({ success: true });

  try {
    const body = req.body;
    const { code, desc, success, data, signature } = body;

    console.log("[PayOS Webhook] Received:", JSON.stringify({ code, desc, success, orderCode: data?.orderCode }));

    if (!data || !data.orderCode) {
      console.log("[PayOS Webhook] No orderCode in data, skipping");
      return;
    }

    const orderCode = String(data.orderCode);
    const paymentCode = data.code || code;
    const isPaid = paymentCode === "00" || success === true;
    const isFailed = paymentCode === "02";

    // ── 1. Check if this is a wallet topup transaction ──────────────────────
    const drizzleDb = await db.getDb();
    if (drizzleDb) {
      const { eq } = await import("drizzle-orm");
      const { walletTransactions, customers } = await import("../drizzle/schema");

      const walletTx = await drizzleDb
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.payosOrderCode, parseInt(orderCode)))
        .limit(1);

      if (walletTx[0] && walletTx[0].status === "pending") {
        if (isPaid) {
          console.log(`[PayOS Webhook] Wallet topup confirmed for orderCode: ${orderCode}, email: ${walletTx[0].customerEmail}`);
          const amount = parseFloat(walletTx[0].amount);
          const customerEmail = walletTx[0].customerEmail;

          // Get current balance
          const customerRow = await drizzleDb
            .select({ walletBalance: customers.walletBalance })
            .from(customers)
            .where(eq(customers.email, customerEmail))
            .limit(1);

          const currentBalance = parseFloat(customerRow[0]?.walletBalance || "0");
          const newBalance = currentBalance + amount;

          // Update customer wallet balance
          await drizzleDb
            .update(customers)
            .set({ walletBalance: newBalance.toString() })
            .where(eq(customers.email, customerEmail));

          // Update wallet transaction status
          await drizzleDb
            .update(walletTransactions)
            .set({
              status: "completed",
              balanceBefore: currentBalance.toString(),
              balanceAfter: newBalance.toString(),
            })
            .where(eq(walletTransactions.payosOrderCode, parseInt(orderCode)));

          console.log(`[PayOS Webhook] Wallet updated: ${customerEmail} ${currentBalance} -> ${newBalance}`);

          // Create customer notification for successful topup
          try {
            const { customerNotifications, users } = await import("../drizzle/schema");
            const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
            if (owner[0]) {
              await drizzleDb.insert(customerNotifications).values({
                userId: owner[0].id,
                customerEmail,
                title: "Nạp tiền thành công",
                message: `Số dư ví của bạn đã được cộng ${amount.toLocaleString("vi-VN")}đ. Số dư hiện tại: ${newBalance.toLocaleString("vi-VN")}đ.`,
                type: "payment",
                link: "/wallet",
              });
            }
          } catch (notifErr) {
            console.error("[PayOS Webhook] Notification error:", notifErr);
          }
        } else if (isFailed) {
          await drizzleDb
            .update(walletTransactions)
            .set({ status: "failed" })
            .where(eq(walletTransactions.payosOrderCode, parseInt(orderCode)));
          console.log(`[PayOS Webhook] Wallet topup failed for orderCode: ${orderCode}`);
        }
        return; // Wallet topup handled, no need to check invoices
      }
    }

    // ── 2. Check if this is an invoice payment ───────────────────────────────
    const invoice = await db.getInvoiceByOrderCode(orderCode);

    if (!invoice) {
      console.log(`[PayOS Webhook] No invoice or wallet tx found for orderCode: ${orderCode}`);
      return;
    }

    // Verify signature if checksumKey is available
    const gatewayConfig = await db.getPaymentGatewaysConfigByUserId(invoice.userId);
    if (gatewayConfig?.payosChecksumKey && signature) {
      const isValid = verifyPayOSWebhookSignature(data, gatewayConfig.payosChecksumKey, signature);
      if (!isValid) {
        console.warn(`[PayOS Webhook] Signature mismatch for orderCode: ${orderCode} - continuing anyway`);
      }
    }

    if (isPaid && invoice.status !== "PAID") {
      console.log(`[PayOS Webhook] Marking invoice ${invoice.id} as PAID (orderCode: ${orderCode})`);
      
      await db.updateInvoice(invoice.id, {
        status: "PAID",
        paidAt: new Date(),
      });

      await db.createActivityLog(
        invoice.userId,
        "PAYMENT_RECEIVED",
        "invoice",
        invoice.id,
        { orderCode, amount: data.amount, via: "payos_webhook" }
      );

      // Send payment confirmation email
      try {
        const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
        const settings = await db.getUserSettings(invoice.userId);
        const templates = await db.getInvoiceTemplatesByUserId(invoice.userId);
        const defaultTemplate = templates.find(t => t.isDefault) || templates[0];

        const recipientEmail = customer?.email;
        // Check customer notification preference before sending email
        const shouldSendEmail = !customer || customer.notifyOrderStatus !== false;
        if (recipientEmail && shouldSendEmail) {
          const emailHtml = generatePaymentConfirmationEmailHTML({
            invoiceNumber: invoice.invoiceNumber,
            customerName: customer?.name || "Khách Hàng",
            totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : (invoice.totalAmount as number),
            currency: invoice.currency || "VND",
            paidAt: new Date(),
            companyName: settings?.companyName || defaultTemplate?.companyName || "Công Ty",
          });

          await sendEmail({
            to: recipientEmail,
            subject: `Xác nhận thanh toán - Hóa đơn ${invoice.invoiceNumber}`,
            html: emailHtml,
            userId: invoice.userId,
          });
          console.log(`[PayOS Webhook] Sent payment confirmation email to ${recipientEmail}`);
        } else if (recipientEmail && !shouldSendEmail) {
          console.log(`[PayOS Webhook] Skipped email for ${recipientEmail} (notifyOrderStatus=false)`);
        }
      } catch (emailErr) {
        console.error("[PayOS Webhook] Failed to send confirmation email:", emailErr);
      }

    } else if (isFailed && invoice.status === "CREATED") {
      console.log(`[PayOS Webhook] Invoice ${invoice.id} payment failed (orderCode: ${orderCode})`);
      await db.updateInvoice(invoice.id, { status: "FAILED" });
    } else {
      console.log(`[PayOS Webhook] No status change for invoice ${invoice.id}, current: ${invoice.status}, code: ${paymentCode}`);
    }

  } catch (error) {
    console.error("[PayOS Webhook] Processing error:", error);
  }
});

export default router;
