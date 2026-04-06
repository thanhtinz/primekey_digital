import crypto from "crypto";
import { Router, Request, Response } from "express";
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
    const invoice = await db.getInvoiceByOrderCode(orderCode);

    if (!invoice) {
      console.log(`[PayOS Webhook] No invoice found for orderCode: ${orderCode}`);
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

    // PayOS sends code "00" in data for successful payment
    const paymentCode = data.code || code;
    const isPaid = paymentCode === "00" || success === true;
    const isFailed = paymentCode === "02";

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
        const items = await db.getInvoiceItemsByInvoiceId(invoice.id);
        const settings = await db.getUserSettings(invoice.userId);
        const templates = await db.getInvoiceTemplatesByUserId(invoice.userId);
        const defaultTemplate = templates.find(t => t.isDefault) || templates[0];

        const recipientEmail = customer?.email;
        if (recipientEmail) {
          const emailHtml = generatePaymentConfirmationEmailHTML({
            invoiceNumber: invoice.invoiceNumber,
            customerName: customer?.name || "Khách Hàng",
            totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
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

// PayPal Webhook Handler
router.post("/paypal", async (req, res) => {
  try {
    const { event_type, resource } = req.body;

    // Verify webhook signature (implement PayPal signature verification)
    // For now, we'll assume it's valid

    if (event_type === "CHECKOUT.ORDER.COMPLETED") {
      const { id: orderId, purchase_units } = resource;
      const amount = purchase_units[0]?.amount?.value;
      const currencyCode = purchase_units[0]?.amount?.currency_code;

      // In production, you would:
      // 1. Query invoices by paymentTransactionId
      // 2. Update the invoice status and payment details
      // 3. Send confirmation email
      
      console.log(`[PayPal Webhook] Payment completed for order ${orderId}, amount: ${amount} ${currencyCode}`);
      
      // await db.updateInvoice(invoiceId, { status: "PAID", paidAt: new Date(), paymentTransactionId: orderId });
    } else if (event_type === "CHECKOUT.ORDER.APPROVED") {
      console.log(`[PayPal Webhook] Order approved: ${resource.id}`);
    } else if (event_type === "CHECKOUT.ORDER.DENIED") {
      console.log(`[PayPal Webhook] Order denied: ${resource.id}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[PayPal Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
