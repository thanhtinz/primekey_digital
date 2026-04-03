import { Router } from "express";
import * as db from "./db";
import { sendEmail, generatePaymentConfirmationEmailHTML } from "./email";

const router = Router();

// PayOS Webhook Handler
router.post("/payos", async (req, res) => {
  try {
    const { data, code, message } = req.body;

    // Verify webhook signature (implement PayOS signature verification)
    // For now, we'll assume it's valid

    if (code === "00" && data) {
      const { orderCode, amount, status, transactionDateTime } = data;

      // In production, you would:
      // 1. Query invoices by paymentTransactionId or a custom orderCode field
      // 2. Update the invoice status and payment details
      // 3. Send confirmation email
      
      console.log(`[PayOS Webhook] Payment received for order ${orderCode}, amount: ${amount}, status: ${status}`);

      if (status === "PAID" || status === "00") {
        console.log(`[PayOS] Payment completed for order ${orderCode}`);
        // await db.updateInvoice(invoiceId, { status: "PAID", paidAt: new Date() });
      } else if (status === "CANCELLED" || status === "EXPIRED") {
        console.log(`[PayOS] Payment cancelled/expired for order ${orderCode}`);
      } else if (status === "FAILED") {
        console.log(`[PayOS] Payment failed for order ${orderCode}`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[PayOS Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
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
