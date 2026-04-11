import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { generateInvoicePDF } from "./pdf";
import { generateInvoiceExcel } from "./excel";
import { sendEmail, generateInvoiceEmailHTML, generatePaymentConfirmationEmailHTML, generateStatusUpdateEmailHTML } from "./email";
import crypto from "crypto";
import { createPayOSPaymentLink, getPayOSPaymentStatus } from "./payos";

// Telegram notification helper (legacy - kept for compatibility)
async function sendTelegramNotification(userId: number, message: string): Promise<void> {
  try {
    const settings = await db.getUserSettings(userId);
    if (!settings?.telegramEnabled || !settings?.telegramBotToken || !settings?.telegramChatId) return;
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: settings.telegramChatId, text: message, parse_mode: "HTML" }),
    });
  } catch { /* silent fail */ }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      // Never expose password hash to client
      const { password: _pw, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Invoices
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getInvoicesByUserIdWithCustomer(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        // Fetch customer info if customerId exists
        let customerEmail: string | null = null;
        let customerName: string | null = null;
        let customerPhone: string | null = null;
        let customerAddress: string | null = null;
        if (invoice.customerId) {
          const customer = await db.getCustomerById(invoice.customerId);
          customerEmail = customer?.email || null;
          customerName = customer?.name || null;
          customerPhone = customer?.phone || null;
          customerAddress = customer?.address || null;
        }
        // Fetch invoice items
        const items = await db.getInvoiceItemsByInvoiceId(invoice.id);
        return { ...invoice, customerEmail, customerName, customerPhone, customerAddress, items };
      }),

    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          invoiceNumber: z.string(),
          issueDate: z.date(),
          dueDate: z.date(),
          currency: z.enum(["VND", "USD"]),
          subtotal: z.number(),
          taxAmount: z.number(),
          discountAmount: z.number(),
          totalAmount: z.number(),
          status: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]),
          notes: z.string().optional(),
          items: z.array(z.object({
            productId: z.number().optional(),
            name: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            taxRate: z.number().optional(),
            discount: z.number().optional(),
            taxAmount: z.number().optional(),
            totalAmount: z.number(),
          })).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { dueDate, issueDate, items: inputItems, ...rest } = input;
        await db.createInvoice({
          ...rest,
          userId: ctx.user.id,
          expiresAt: dueDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Save invoice items if provided
        if (inputItems && inputItems.length > 0) {
          const allInvoices = await db.getInvoicesByUserId(ctx.user.id);
          const created = allInvoices.find(i => i.invoiceNumber === rest.invoiceNumber);
          if (created) {
            for (const item of inputItems) {
              await db.createInvoiceItem({
                invoiceId: created.id,
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount ?? 0,
                taxId: undefined,
                taxAmount: item.taxAmount ?? 0,
                totalAmount: item.totalAmount,
              });
            }
          }
        }
        // Send Telegram notification for new invoice
        void sendTelegramNotification(ctx.user.id, `📄 <b>Hóa đơn mới được tạo</b>\nMã: ${rest.invoiceNumber}\nTổng tiền: ${Number(rest.totalAmount).toLocaleString("vi-VN")} ${rest.currency || "VND"}`);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]).optional(),
          notes: z.string().optional(),
          // Full edit fields
          customerId: z.number().optional(),
          dueDate: z.date().optional(),
          currency: z.enum(["VND", "USD"]).optional(),
          subtotal: z.number().optional(),
          taxAmount: z.number().optional(),
          discountAmount: z.number().optional(),
          totalAmount: z.number().optional(),
          items: z.array(z.object({
            productId: z.number().optional(),
            name: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            taxRate: z.number().optional(),
            discount: z.number().optional(),
            taxAmount: z.number().optional(),
            totalAmount: z.number(),
          })).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        const { items: inputItems, dueDate, ...rest } = input;
        await db.updateInvoice(input.id, {
          ...rest,
          ...(dueDate ? { expiresAt: dueDate } : {}),
          updatedAt: new Date(),
        });
        // If items provided, replace all items
        if (inputItems !== undefined) {
          await db.deleteInvoiceItemsByInvoiceId(input.id);
          for (const item of inputItems) {
            await db.createInvoiceItem({
              invoiceId: input.id,
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount ?? 0,
              taxId: undefined,
              taxAmount: item.taxAmount ?? 0,
              totalAmount: item.totalAmount,
            });
          }
        }
        return { success: true };
      }),
    // Search invoices by product name
    listByProduct: protectedProcedure
      .input(z.object({ productName: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        if (!input.productName.trim()) return db.getInvoicesByUserIdWithCustomer(ctx.user.id);
        return db.searchInvoicesByProduct(ctx.user.id, input.productName.trim());
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        await db.deleteInvoice(input.id);
        return { success: true };
      }),

    // Update invoice status and optionally send email notification
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["CREATED", "PAID", "SHIPPING", "COMPLETED", "WARRANTY", "FAILED", "EXPIRED", "CANCELLED"]),
        sendEmail: z.boolean().optional(),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        
        // Generate review token if status is WARRANTY (order complete)
        let reviewToken = invoice.reviewToken;
        if (input.status === "WARRANTY" && !reviewToken) {
          reviewToken = crypto.randomBytes(32).toString("hex");
        }
        
        await db.updateInvoice(input.id, {
          status: input.status,
          reviewToken,
          paidAt: input.status === "PAID" ? new Date() : invoice.paidAt,
          updatedAt: new Date(),
        });
        
        // Generate per-product review tokens for each item when status is WARRANTY
        if (input.status === "WARRANTY") {
          try {
            const { getDb: getItemsDb } = await import("./db");
            const { invoiceItems } = await import("../drizzle/schema");
            const { eq, isNull } = await import("drizzle-orm");
            const itemsDb = await getItemsDb();
            if (itemsDb) {
              const items = await itemsDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, input.id));
              for (const item of items) {
                if (item.productId && !(item as any).productReviewToken) {
                  const productReviewToken = crypto.randomBytes(32).toString("hex");
                  await itemsDb.update(invoiceItems).set({ productReviewToken } as any).where(eq(invoiceItems.id, item.id));
                }
              }
            }
          } catch (tokenErr) {
            console.error("[updateStatus] Product review token error:", tokenErr);
          }
        }
        
        // Send email notification if requested OR when reaching WARRANTY (auto-send review link)
        const shouldSendEmail = input.sendEmail || input.status === "WARRANTY";
        if (shouldSendEmail) {
          const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
          if (customer?.email) {
            const userSettings = await db.getUserSettings(ctx.user.id);
            const statusLabels: Record<string, string> = {
              CREATED: "Chờ xác nhận", PAID: "Đang xử lý", SHIPPING: "Đang giao hàng",
              COMPLETED: "Hoàn thành", WARRANTY: "Bảo hành", FAILED: "Thất bại",
              EXPIRED: "Hết hạn", REFUNDED: "Đã hoàn tiền", CANCELLED: "Đã hủy",
            };
            // Build base URL from origin (passed by frontend) or VITE_APP_URL fallback
            const baseUrl = input.origin || process.env.VITE_APP_URL || "";
            const reviewUrl = reviewToken ? `${baseUrl}/review/${reviewToken}` : undefined;
            const trackUrl = `${baseUrl}/track-order`;
            // Try to load custom email template from DB, fallback to default
            const emailType = input.status as "CREATED" | "PAID" | "SHIPPING" | "WARRANTY" | "REVIEW";
            const customTemplate = await db.getEmailTemplateByType(ctx.user.id, emailType).catch(() => null);
            const companyName = userSettings?.companyName || "";
            const replaceVars = (str: string) => str
              .replace(/{{customerName}}/g, customer.name)
              .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
              .replace(/{{totalAmount}}/g, invoice.totalAmount ? `${Number(invoice.totalAmount).toLocaleString("vi-VN")} đ` : "")
              .replace(/{{status}}/g, statusLabels[input.status] || input.status)
              .replace(/{{trackUrl}}/g, trackUrl || "")
              .replace(/{{reviewUrl}}/g, reviewUrl || "")
              .replace(/{{companyName}}/g, companyName);
            const html = customTemplate
              ? replaceVars(customTemplate.htmlBody)
              : generateStatusUpdateEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: customer.name,
                  status: input.status,
                  statusLabel: statusLabels[input.status] || input.status,
                  companyName,
                  reviewUrl,
                  trackUrl,
                });
            const subject = customTemplate
              ? replaceVars(customTemplate.subject)
              : `Cập Nhật Đơn Hàng ${invoice.invoiceNumber} - ${statusLabels[input.status]}`;
            await sendEmail({
              to: customer.email,
              subject,
              html,
              userId: ctx.user.id,
            });
          }
        }
        
        // Send customer notification for status change
        try {
          const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
          if (customer?.email) {
            const { getDb: getNotifDb } = await import("./db");
            const { customerNotifications } = await import("../drizzle/schema");
            const notifDb = await getNotifDb();
            const statusNotifMap: Record<string, { title: string; message: string; type: "info" | "success" | "warning" | "order" | "payment" | "promo" }> = {
              PAID: { title: "Thanh toán thành công", message: `Đơn hàng ${invoice.invoiceNumber} đã được xác nhận thanh toán.`, type: "payment" },
              SHIPPING: { title: "Đang giao hàng", message: `Đơn hàng ${invoice.invoiceNumber} đang được giao đến bạn.`, type: "order" },
              WARRANTY: { title: "Bảo hành kích hoạt", message: `Đơn hàng ${invoice.invoiceNumber} đã hoàn thành và được kích hoạt bảo hành.`, type: "success" },
              FAILED: { title: "Thanh toán thất bại", message: `Đơn hàng ${invoice.invoiceNumber} thanh toán không thành công.`, type: "warning" },
              EXPIRED: { title: "Đơn hàng hết hạn", message: `Đơn hàng ${invoice.invoiceNumber} đã hết hạn.`, type: "warning" },
            };
            const notifData = statusNotifMap[input.status];
            if (notifData && notifDb) {
              await notifDb.insert(customerNotifications).values({
                userId: ctx.user.id,
                customerEmail: customer.email,
                title: notifData.title,
                message: notifData.message,
                type: notifData.type,
                link: `/my-account`,
              });
            }
          }
        } catch (notifErr) {
          console.error("[updateStatus] Notification error:", notifErr);
        }
        
        return { success: true, reviewToken };
      }),
    // Get invoice items
    getItems: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return db.getInvoiceItemsByInvoiceId(input.invoiceId);
      }),
    // Duplicate invoice
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) throw new Error("Invoice not found");
        const items = await db.getInvoiceItemsByInvoiceId(input.id);
        // Generate new invoice number
        const newNumber = `INV-${Date.now().toString().slice(-8)}`;
        const newInvoice = await db.createInvoice({
          userId: ctx.user.id,
          customerId: invoice.customerId,
          invoiceNumber: newNumber,
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          totalAmount: invoice.totalAmount,
          status: "CREATED",
          notes: invoice.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Get the newly created invoice id
        const allInvoices = await db.getInvoicesByUserId(ctx.user.id);
        const created = allInvoices.find(i => i.invoiceNumber === newNumber);
        if (created) {
          for (const item of items) {
            await db.createInvoiceItem({
              invoiceId: created.id,
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxId: item.taxId,
              taxAmount: item.taxAmount,
              totalAmount: item.totalAmount,
            });
          }
          await db.createActivityLog(ctx.user.id, "DUPLICATE_INVOICE", "invoice", created.id);
          return { success: true, newId: created.id, invoiceNumber: newNumber };
        }
        return { success: true, newId: 0, invoiceNumber: newNumber };
      }),
    // Manual status transition with auto email + PayOS QR regeneration
    manualTransition: protectedProcedure
      .input(z.object({
        id: z.number(),
        newStatus: z.enum(["CREATED", "PAID", "SHIPPING", "COMPLETED", "WARRANTY", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"]),
        note: z.string().optional(),
        regeneratePaymentLink: z.boolean().optional(), // true = tạo lại QR PayOS
        origin: z.string().optional(), // window.location.origin từ frontend
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) throw new Error("Invoice not found");

        const statusLabels: Record<string, string> = {
          CREATED: "Chờ xác nhận", PAID: "Đang xử lý", SHIPPING: "Đang giao hàng",
          COMPLETED: "Hoàn thành", WARRANTY: "Bảo hành", FAILED: "Thất bại",
          EXPIRED: "Hết hạn", REFUNDED: "Đã hoàn tiền", CANCELLED: "Đã hủy",
        };

        // Generate review token if transitioning to WARRANTY
        let reviewToken = invoice.reviewToken;
        if (input.newStatus === "WARRANTY" && !reviewToken) {
          reviewToken = crypto.randomBytes(32).toString("hex");
        }

        // Handle PayOS payment link regeneration (when transitioning to CREATED or explicitly requested)
        let paymentUrl = invoice.paymentUrl;
        let qrCode = invoice.qrCode;
        let paymentLinkId = invoice.paymentTransactionId;

        if (input.regeneratePaymentLink || input.newStatus === "CREATED") {
          try {
            const gatewayConfig = await db.getPaymentGatewaysConfigByUserId(ctx.user.id);
            if (gatewayConfig?.payosApiKey && gatewayConfig?.payosClientId && gatewayConfig?.payosChecksumKey) {
              const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
              const origin = input.origin || "";
              const orderCode = Date.now() % 9007199254740991; // unique numeric order code
              const payosResult = await createPayOSPaymentLink(
                {
                  clientId: gatewayConfig.payosClientId,
                  apiKey: gatewayConfig.payosApiKey,
                  checksumKey: gatewayConfig.payosChecksumKey,
                },
                {
                  orderCode,
                  amount: Math.round(Number(invoice.totalAmount)),
                  description: `TT ${invoice.invoiceNumber}`.slice(0, 25),
                  buyerName: customer?.name || "Khach hang",
                  buyerEmail: customer?.email || "",
                  buyerPhone: customer?.phone || "",
                  buyerAddress: customer?.address || "",
                  returnUrl: `${origin}/track-order`,
                  cancelUrl: `${origin}/payment-cancel?type=order&orderCode=${orderCode}`,
                }
              );
              paymentUrl = payosResult.checkoutUrl;
              qrCode = payosResult.qrCode;
              paymentLinkId = String(payosResult.paymentLinkId);
            }
          } catch (payosErr) {
            console.error("[manualTransition] PayOS error:", payosErr);
            // Continue without failing - just won't have new QR
          }
        }

        // Compute warranty dates when transitioning to WARRANTY
        let warrantyStartDate = (invoice as any).warrantyStartDate;
        let warrantyExpiryDate = (invoice as any).warrantyExpiryDate;
        let warrantyMonths = (invoice as any).warrantyMonths || 0;
        if (input.newStatus === "WARRANTY" && !warrantyStartDate) {
          warrantyStartDate = new Date();
          // Calculate warrantyMonths from invoice items' products
          const { getDb } = await import("./db");
          const drizzleDb = await getDb();
          if (drizzleDb) {
            const { invoiceItems, products } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const items = await drizzleDb.select({ productId: invoiceItems.productId })
              .from(invoiceItems).where(eq(invoiceItems.invoiceId, input.id));
            const productIds = items.map(i => i.productId).filter(Boolean) as number[];
            if (productIds.length > 0) {
              let maxMonths = 0;
              for (const pid of productIds) {
                const [p] = await drizzleDb.select({ warrantyMonths: products.warrantyMonths })
                  .from(products).where(eq(products.id, pid)).limit(1);
                if (p && (p.warrantyMonths || 0) > maxMonths) maxMonths = p.warrantyMonths || 0;
              }
              warrantyMonths = maxMonths;
            }
            if (warrantyMonths > 0) {
              warrantyExpiryDate = new Date(warrantyStartDate.getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000);
            }
          }
        }
        // Update invoice status
        await db.updateInvoice(input.id, {
          status: input.newStatus,
          reviewToken,
          paidAt: input.newStatus === "PAID" ? new Date() : invoice.paidAt,
          paymentUrl: paymentUrl || invoice.paymentUrl,
          qrCode: qrCode || invoice.qrCode,
          paymentTransactionId: paymentLinkId || invoice.paymentTransactionId,
          warrantyStartDate: warrantyStartDate || null,
          warrantyExpiryDate: warrantyExpiryDate || null,
          warrantyMonths,
          updatedAt: new Date(),
        });

        // Auto-send email for all transitions (except FAILED/EXPIRED unless explicitly noted)
        let emailSentOk = false;
        let emailError: string | undefined;
        let paymentLinkRegenOk = !!(paymentUrl && (input.regeneratePaymentLink || input.newStatus === "CREATED"));
        // Auto-refund to wallet when status changes to REFUNDED
        if (input.newStatus === "REFUNDED" && invoice.paidAt) {
          try {
            const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
            if (customer) {
              const { getDb: getRefundDb } = await import("./db");
              const { eq: eqR } = await import("drizzle-orm");
              const { walletTransactions, customers: customersTable, customerNotifications } = await import("../drizzle/schema");
              const refundDb = await getRefundDb();
              const refundAmount = Number(invoice.totalAmount) || 0;
              if (refundAmount > 0 && customer.email && refundDb) {
                const currentBalance = Number(customer.walletBalance || 0);
                const newBalance = currentBalance + refundAmount;
                // Add wallet transaction for refund
                await refundDb.insert(walletTransactions).values({
                  customerEmail: customer.email,
                  type: "refund",
                  amount: String(refundAmount),
                  balanceBefore: String(currentBalance),
                  balanceAfter: String(newBalance),
                  description: `Hoàn tiền đơn hàng ${invoice.invoiceNumber}`,
                  invoiceId: invoice.id,
                  status: "completed",
                });
                // Update customer wallet balance
                await refundDb.update(customersTable).set({ walletBalance: String(newBalance) }).where(eqR(customersTable.id, customer.id));
                // Create notification for customer
                try {
                  await refundDb.insert(customerNotifications).values({
                    userId: ctx.user.id,
                    customerEmail: customer.email!,
                    title: "Hoàn tiền thành công",
                    message: `Đơn hàng ${invoice.invoiceNumber} đã được hoàn tiền ${refundAmount.toLocaleString("vi-VN")} đ vào ví của bạn.`,
                    type: "success",
                  });
                } catch {}
              }
            }
          } catch (refundErr: any) {
            console.error("[autoRefund] Error:", refundErr);
          }
        }
        const autoEmailStatuses = ["PAID", "SHIPPING", "WARRANTY", "CREATED"];
        if (autoEmailStatuses.includes(input.newStatus)) {
          try {
            const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
            if (customer?.email) {
              const userSettings = await db.getUserSettings(ctx.user.id);
              const companyName = userSettings?.companyName || "";
              const origin = input.origin || "";
              const reviewUrl = reviewToken ? `${origin}/review/${reviewToken}` : undefined;
              const trackUrl = `${origin}/track-order`;
              // Use custom payment page URL instead of PayOS checkout URL directly
              const paymentPageUrl = origin ? `${origin}/pay/${invoice.id}` : (paymentUrl || "");
              const emailType = input.newStatus as "CREATED" | "PAID" | "SHIPPING" | "WARRANTY";
              const customTemplate = await db.getEmailTemplateByType(ctx.user.id, emailType).catch(() => null);
              const replaceVars = (str: string) => str
                .replace(/{{customerName}}/g, customer.name)
                .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
                .replace(/{{totalAmount}}/g, invoice.totalAmount ? `${Number(invoice.totalAmount).toLocaleString("vi-VN")} đ` : "")
                .replace(/{{status}}/g, statusLabels[input.newStatus] || input.newStatus)
                .replace(/{{trackUrl}}/g, trackUrl)
                .replace(/{{reviewUrl}}/g, reviewUrl || "")
                .replace(/{{companyName}}/g, companyName)
                .replace(/{{paymentUrl}}/g, paymentPageUrl);
              let html: string;
              let subject: string;
              if (customTemplate) {
                html = replaceVars(customTemplate.htmlBody);
                subject = replaceVars(customTemplate.subject);
              } else if (input.newStatus === "PAID") {
                // Use dedicated payment confirmation email for PAID
                html = generatePaymentConfirmationEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: customer.name,
                  totalAmount: Number(invoice.totalAmount),
                  currency: invoice.currency || "VND",
                  companyName,
                  paidAt: new Date(),
                });
                subject = `Xác Nhận Thanh Toán Đơn Hàng ${invoice.invoiceNumber}`;
              } else if (input.newStatus === "CREATED" && paymentPageUrl) {
                // Use invoice email template with payment link when regenerating QR
                html = generateInvoiceEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: customer.name,
                  totalAmount: Number(invoice.totalAmount),
                  currency: invoice.currency || "VND",
                  companyName,
                  paymentUrl: paymentPageUrl,
                });
                subject = `Hóa Đơn ${invoice.invoiceNumber} - Link Thanh Toán Mới`;
              } else {
                html = generateStatusUpdateEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: customer.name,
                  status: input.newStatus,
                  statusLabel: statusLabels[input.newStatus] || input.newStatus,
                  companyName,
                  reviewUrl,
                  trackUrl,
                });
                subject = `Cập Nhật Đơn Hàng ${invoice.invoiceNumber} - ${statusLabels[input.newStatus]}`;
              }
              await sendEmail({ to: customer.email, subject, html, userId: ctx.user.id });
              emailSentOk = true;
            }
          } catch (emailErr: any) {
            console.error("[manualTransition] Email error:", emailErr);
            emailError = emailErr?.message || "Gửi email thất bại";
            // Continue without failing - status change still succeeds
          }
        }

        // Auto-create customer notification for order status change
        try {
          const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
          if (customer?.email) {
            const { getDb: getNotifDb } = await import("./db");
            const { customerNotifications } = await import("../drizzle/schema");
            const notifDb = await getNotifDb();
            const statusNotifMap: Record<string, { title: string; message: string; type: "info" | "success" | "warning" | "order" | "payment" | "promo" }> = {
              PAID: { title: "Thanh toán thành công", message: `Đơn hàng ${invoice.invoiceNumber} đã được xác nhận thanh toán.`, type: "payment" },
              SHIPPING: { title: "Đang giao hàng", message: `Đơn hàng ${invoice.invoiceNumber} đang được giao đến bạn.`, type: "order" },
              WARRANTY: { title: "Bảo hành kích hoạt", message: `Đơn hàng ${invoice.invoiceNumber} đã được kích hoạt bảo hành.`, type: "success" },
              FAILED: { title: "Thanh toán thất bại", message: `Đơn hàng ${invoice.invoiceNumber} thanh toán không thành công.`, type: "warning" },
              REFUNDED: { title: "Hoàn tiền thành công", message: `Đơn hàng ${invoice.invoiceNumber} đã được hoàn tiền.`, type: "success" },
            };
            const notifData = statusNotifMap[input.newStatus];
            if (notifData && notifDb) {
              await notifDb.insert(customerNotifications).values({
                userId: ctx.user.id,
                customerEmail: customer.email,
                title: notifData.title,
                message: notifData.message,
                type: notifData.type,
                link: `/my-account`,
              });
            }
          }
        } catch (notifErr) {
          console.error("[manualTransition] Notification error:", notifErr);
        }

        // Log activity
        const logNote = input.note ? ` - ${input.note}` : "";
        await db.createActivityLog(
          ctx.user.id,
          `MANUAL_STATUS_CHANGE:${invoice.status}->${input.newStatus}${logNote}`,
          "invoice",
          input.id
        );

        return {
          success: true,
          newStatus: input.newStatus,
          paymentUrl: paymentUrl || invoice.paymentUrl,
          qrCode: qrCode || invoice.qrCode,
          reviewToken,
          emailSent: emailSentOk,
          emailError: emailError || undefined,
          paymentLinkRegenerated: paymentLinkRegenOk,
        };
      }),

    // Public: get invoices by customer email (for order tracking page)
    getPaymentInfo: publicProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        // Only return safe public fields - no internal data
        const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : undefined;
        const items = await db.getInvoiceItemsByInvoiceId(invoice.id);
        // Get company info from owner's settings
        const settings = await db.getUserSettings(invoice.userId);
        // Get logo from default template
        const templates = await db.getInvoiceTemplatesByUserId(invoice.userId);
        const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          totalAmount: invoice.totalAmount,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          currency: invoice.currency,
          qrCode: invoice.qrCode,
          paymentUrl: invoice.paymentUrl,
          expiresAt: invoice.expiresAt,
          createdAt: invoice.createdAt,
          notes: invoice.notes,
          publicNote: invoice.publicNote || null,
          customerName: customer?.name || "Khách Hàng",
          companyName: settings?.companyName || defaultTemplate?.companyName || "Công Ty",
          companyPhone: settings?.companyPhone || "",
          companyEmail: settings?.companyEmail || "",
          companyLogo: settings?.logoUrl || defaultTemplate?.logo || null,
          accentColor: defaultTemplate?.accentColor || "#2563eb",
          items: items.map(item => ({
            name: item.name,
            quantity: typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity,
            unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
            totalAmount: typeof item.totalAmount === "string" ? parseFloat(item.totalAmount) : item.totalAmount,
          })),
        };
      }),
    checkPaymentStatus: publicProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        // If already paid in our DB, return immediately
        if (invoice.status === "PAID") {
          return { status: "PAID", paid: true };
        }
        // If has paymentTransactionId (orderCode stored as string), check PayOS for latest status
        if (invoice.paymentTransactionId) {
          try {
            const orderCode = parseInt(invoice.paymentTransactionId);
            if (!isNaN(orderCode)) {
              const gatewayConfig = await db.getPaymentGatewaysConfigByUserId(invoice.userId);
              if (gatewayConfig?.payosClientId && gatewayConfig?.payosApiKey) {
                const payosStatus = await getPayOSPaymentStatus(
                  {
                    clientId: gatewayConfig.payosClientId,
                    apiKey: gatewayConfig.payosApiKey,
                    checksumKey: gatewayConfig.payosChecksumKey || "",
                  },
                  orderCode
                );
                if (payosStatus.status === "PAID") {
                  // Update our DB
                  await db.updateInvoice(invoice.id, { status: "PAID", paidAt: new Date() });
                  return { status: "PAID" as const, paid: true };
                }
                return { status: payosStatus.status, paid: false };
              }
            }
          } catch (e) {
            // Ignore PayOS check errors, return DB status
          }
        }
        return { status: invoice.status ?? "CREATED", paid: false };
      }),
    regeneratePaymentLink: publicProcedure
      .input(z.object({ invoiceId: z.number(), origin: z.string().optional() }))
      .mutation(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        if (invoice.status === "PAID") throw new Error("Hóa đơn đã được thanh toán");
        const gatewayConfig = await db.getPaymentGatewaysConfigByUserId(invoice.userId);
        if (!gatewayConfig?.payosApiKey || !gatewayConfig?.payosClientId || !gatewayConfig?.payosChecksumKey) {
          throw new Error("Chưa cấu hình PayOS");
        }
        const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
        const origin = input.origin || "";
        const orderCode = Date.now() % 9007199254740991;
        const payosResult = await createPayOSPaymentLink(
          {
            clientId: gatewayConfig.payosClientId,
            apiKey: gatewayConfig.payosApiKey,
            checksumKey: gatewayConfig.payosChecksumKey,
          },
          {
            orderCode,
            amount: Math.round(Number(invoice.totalAmount)),
            description: `TT ${invoice.invoiceNumber}`.slice(0, 25),
            buyerName: customer?.name || "Khach hang",
            buyerEmail: customer?.email || "",
            buyerPhone: customer?.phone || "",
            buyerAddress: customer?.address || "",
            returnUrl: `${origin}/track-order`,
            cancelUrl: `${origin}/payment-cancel?type=order&orderCode=${orderCode}`,
          }
        );
        const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await db.updateInvoice(invoice.id, {
          paymentUrl: payosResult.checkoutUrl,
          qrCode: payosResult.qrCode,
          paymentTransactionId: String(orderCode),
          expiresAt: newExpiresAt,
        });
        return {
          qrCode: payosResult.qrCode,
          paymentUrl: payosResult.checkoutUrl,
          expiresAt: newExpiresAt,
        };
      }),
    getByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { invoices: invoicesTable, invoiceItems, customers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Find customers by email
        const customerList = await drizzleDb.select().from(customers).where(eq(customers.email, input.email));
        if (customerList.length === 0) return [];
        const results = [];
        for (const customer of customerList) {
          const invs = await drizzleDb
            .select({
              id: invoicesTable.id,
              invoiceNumber: invoicesTable.invoiceNumber,
              status: invoicesTable.status,
              totalAmount: invoicesTable.totalAmount,
              subtotal: invoicesTable.subtotal,
              taxAmount: invoicesTable.taxAmount,
              discountAmount: invoicesTable.discountAmount,
              currency: invoicesTable.currency,
              createdAt: invoicesTable.createdAt,
              updatedAt: invoicesTable.updatedAt,
              paidAt: invoicesTable.paidAt,
              notes: invoicesTable.notes,
              publicNote: invoicesTable.publicNote,
              paymentUrl: invoicesTable.paymentUrl,
              warrantyStartDate: invoicesTable.warrantyStartDate,
              warrantyExpiryDate: invoicesTable.warrantyExpiryDate,
              warrantyMonths: invoicesTable.warrantyMonths,
              orderInfo: invoicesTable.orderInfo,
            })
            .from(invoicesTable)
            .where(eq(invoicesTable.customerId, customer.id));
          for (const inv of invs) {
            const items = await drizzleDb
              .select({ name: invoiceItems.name, quantity: invoiceItems.quantity, unitPrice: invoiceItems.unitPrice, totalAmount: invoiceItems.totalAmount })
              .from(invoiceItems)
              .where(eq(invoiceItems.invoiceId, inv.id));
            results.push({
              ...inv,
              customerName: customer.name,
              customerPhone: customer.phone,
              items,
            });
          }
        }
        // Sort by createdAt descending
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
      }),

    // Public lookup by invoice number (for warranty page)
    lookupByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const { invoices: invoicesTable, invoiceItems, customers } = await import("../drizzle/schema");
        const { eq, ilike } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({
            id: invoicesTable.id,
            invoiceNumber: invoicesTable.invoiceNumber,
            status: invoicesTable.status,
            totalAmount: invoicesTable.totalAmount,
            currency: invoicesTable.currency,
            createdAt: invoicesTable.createdAt,
            expiresAt: invoicesTable.expiresAt,
            notes: invoicesTable.notes,
            publicNote: invoicesTable.publicNote,
            warrantyStartDate: invoicesTable.warrantyStartDate,
            warrantyExpiryDate: invoicesTable.warrantyExpiryDate,
            warrantyMonths: invoicesTable.warrantyMonths,
            customerName: customers.name,
          })
          .from(invoicesTable)
          .leftJoin(customers, eq(invoicesTable.customerId, customers.id))
          .where(ilike(invoicesTable.invoiceNumber, input.code))
          .limit(1);
        if (!rows[0]) return null;
        const inv = rows[0];
        const items = await drizzleDb
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, inv.id));
        return { ...inv, items };
      }),

    // Get invoices expiring within 24 hours (status CREATED)
    getExpiringSoon: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const allInvoices = await db.getInvoicesByUserId(ctx.user.id);
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return allInvoices.filter(inv =>
        inv.status === "CREATED" &&
        inv.expiresAt &&
        new Date(inv.expiresAt) > now &&
        new Date(inv.expiresAt) <= in24h
      ).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
    }),

    // Export filtered invoices to Excel (base64 encoded)
    exportExcel: protectedProcedure
      .input(z.object({
        invoiceIds: z.array(z.number()).optional(), // if provided, export only these
        status: z.string().optional(),
        currency: z.string().optional(),
        productName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const XLSX = await import("xlsx");
        let invoiceList = await db.getInvoicesByUserId(ctx.user.id);
        // Filter by product name if provided
        if (input.productName?.trim()) {
          invoiceList = await db.searchInvoicesByProduct(ctx.user.id, input.productName.trim());
        }
        // Filter by specific IDs if provided
        if (input.invoiceIds && input.invoiceIds.length > 0) {
          invoiceList = invoiceList.filter(inv => input.invoiceIds!.includes(inv.id));
        }
        // Filter by status
        if (input.status && input.status !== "all") {
          invoiceList = invoiceList.filter(inv => inv.status === input.status);
        }
        // Filter by currency
        if (input.currency && input.currency !== "all") {
          invoiceList = invoiceList.filter(inv => inv.currency === input.currency);
        }
        const STATUS_LABELS: Record<string, string> = {
          CREATED: "Chờ xác nhận", PAID: "Đang xử lý", SHIPPING: "Đang giao hàng",
          COMPLETED: "Hoàn thành", WARRANTY: "Bảo hành", FAILED: "Thất bại",
          EXPIRED: "Hết hạn", REFUNDED: "Đã hoàn tiền", CANCELLED: "Đã hủy",
        };
        const rows = invoiceList.map(inv => ({
          "Số Hóa Đơn": inv.invoiceNumber,
          "Trạng Thái": STATUS_LABELS[inv.status || ""] || inv.status || "",
          "Tiền Tệ": inv.currency || "VND",
          "Tạm Tính": Number(inv.subtotal || 0),
          "Giảm Giá": Number(inv.discountAmount || 0),
          "Thuế": Number(inv.taxAmount || 0),
          "Tổng Tiền": Number(inv.totalAmount || 0),
          "Ngày Tạo": inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("vi-VN") : "",
          "Hết Hạn": inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString("vi-VN") : "",
          "Ngày Thanh Toán": inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("vi-VN") : "",
          "Ghi Chú": inv.notes || "",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hóa Đơn");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
        return { base64: buf.toString("base64"), count: rows.length };
      }),

    // Bulk export multiple invoices as a single PDF
    bulkExportPDF: protectedProcedure
      .input(z.object({ invoiceIds: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        if (input.invoiceIds.length === 0) throw new Error("Không có hóa đơn nào được chọn");
        const { generateInvoicePDF } = await import("./pdf");
        const pdfBuffers: Buffer[] = [];
        for (const invoiceId of input.invoiceIds) {
          const invoice = await db.getInvoiceById(invoiceId);
          if (!invoice || invoice.userId !== ctx.user.id) continue;
          const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
          const items = await db.getInvoiceItemsByInvoiceId(invoiceId);
          const template = invoice.templateId ? await db.getInvoiceTemplateById(invoice.templateId) : null;
          const userSettings = await db.getUserSettings(ctx.user.id);
          const companyName = userSettings?.companyName || "";
          try {
            const pdfBuf = await generateInvoicePDF({
              invoiceNumber: invoice.invoiceNumber,
              issueDate: invoice.createdAt,
              dueDate: invoice.expiresAt || undefined,
              currency: invoice.currency || "VND",
              subtotal: Number(invoice.subtotal),
              discountAmount: Number(invoice.discountAmount || 0),
              taxAmount: Number(invoice.taxAmount || 0),
              totalAmount: Number(invoice.totalAmount),
              notes: invoice.notes || "",
              paymentUrl: invoice.paymentUrl || "",
              customerName: customer?.name || "Khách Hàng",
              customerEmail: customer?.email || "",
              customerAddress: customer?.address || "",
              items: items.map(it => ({ name: it.name, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), totalAmount: Number(it.totalAmount) })),
              companyName: template?.companyName || companyName,
              companyAddress: template?.companyAddress || "",
              companyPhone: template?.companyPhone || "",
              companyEmail: template?.companyEmail || "",
              accentColor: template?.headerColor || "#1e40af",
              footerText: template?.footer || "",
            });
            pdfBuffers.push(pdfBuf);
          } catch { /* skip failed */ }
        }
        if (pdfBuffers.length === 0) throw new Error("Không thể tạo PDF");
        // Concatenate all PDFs using a simple approach - return as array of base64
        const combinedBase64 = pdfBuffers.map(b => b.toString("base64"));
        return { pdfs: combinedBase64, count: pdfBuffers.length };
      }),
    listWithDateRange: protectedProcedure
      .input(z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        status: z.string().optional(),
        currency: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const all = await db.getInvoicesByUserIdWithCustomer(ctx.user.id);
        let filtered = all;
        if (input.fromDate) {
          const from = new Date(input.fromDate);
          filtered = filtered.filter(i => new Date(i.createdAt) >= from);
        }
        if (input.toDate) {
          const to = new Date(input.toDate);
          to.setHours(23, 59, 59, 999);
          filtered = filtered.filter(i => new Date(i.createdAt) <= to);
        }
        if (input.status && input.status !== "ALL") {
          filtered = filtered.filter(i => i.status === input.status);
        }
        if (input.currency && input.currency !== "ALL") {
          filtered = filtered.filter(i => i.currency === input.currency);
        }
        return filtered;
      }),
    createRecurring: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        templateId: z.number().optional(),
        currency: z.enum(["VND", "USD"]).default("VND"),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          discount: z.number().optional(),
          taxId: z.number().optional(),
          productId: z.number().optional(),
        })),
        notes: z.string().optional(),
        publicNote: z.string().optional(),
        recurringInterval: z.enum(["weekly", "monthly", "quarterly"]),
        recurringStartDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { items, recurringInterval, recurringStartDate, ...invoiceData } = input;
        const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice - (i.discount || 0), 0);
        const nextDate = new Date(recurringStartDate);
        const invoiceNumber = `INV-${Date.now()}`;
        await db.createInvoice({
          ...invoiceData,
          userId: ctx.user.id,
          invoiceNumber,
          subtotal: String(subtotal),
          totalAmount: String(subtotal),
          isRecurring: true,
          recurringInterval,
          recurringNextDate: nextDate,
          expiresAt: nextDate,
        });
        const allInvoices2 = await db.getInvoicesByUserId(ctx.user.id);
        const createdRecurring = allInvoices2.find(i => i.invoiceNumber === invoiceNumber);
        for (const item of items) {
          const total = item.quantity * item.unitPrice - (item.discount || 0);
          await db.createInvoiceItem({
            invoiceId: createdRecurring?.id ?? 0,
            name: item.name,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            discount: String(item.discount || 0),
            taxId: item.taxId,
            taxAmount: "0",
            totalAmount: String(total),
            productId: item.productId,
          });
        }
        return { success: true };
      }),
    listRecurring: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const all = await db.getInvoicesByUserId(ctx.user.id);
      return all.filter(i => (i as any).isRecurring);
    }),
    updatePublicNote: protectedProcedure
      .input(z.object({ id: z.number(), publicNote: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.updateInvoice(input.id, { publicNote: input.publicNote });
        return { success: true };
      }),
    // Customer: get single order by invoiceNumber + email verification
    getByEmailAndNumber: publicProcedure
      .input(z.object({ email: z.string().email(), invoiceNumber: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const { invoices: invoicesTable, invoiceItems, customers } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const customerList = await drizzleDb.select().from(customers).where(eq(customers.email, input.email));
        if (customerList.length === 0) return null;
        const customerIds = customerList.map(c => c.id);
        const [inv] = await drizzleDb.select().from(invoicesTable)
          .where(and(eq(invoicesTable.invoiceNumber, input.invoiceNumber), eq(invoicesTable.customerId, customerIds[0])))
          .limit(1);
        if (!inv) return null;
        const items = await drizzleDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
        const customer = customerList[0];
        return { ...inv, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone, items };
      }),
    // Customer: export PDF for their own invoice
    exportPdfForCustomer: publicProcedure
      .input(z.object({ email: z.string().email(), invoiceNumber: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { invoices: invoicesTable, invoiceItems, customers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const customerList = await drizzleDb.select().from(customers).where(eq(customers.email, input.email));
        if (customerList.length === 0) throw new Error("Không tìm thấy đơn hàng");
        const [inv] = await drizzleDb.select().from(invoicesTable)
          .where(eq(invoicesTable.invoiceNumber, input.invoiceNumber)).limit(1);
        if (!inv || !customerList.find(c => c.id === inv.customerId)) throw new Error("Không tìm thấy đơn hàng");
        const items = await drizzleDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
        const customer = customerList.find(c => c.id === inv.customerId)!;
        const userSettings = await db.getUserSettings(inv.userId);
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.createdAt,
          dueDate: inv.expiresAt || undefined,
          customerName: customer.name || "Khách Hàng",
          customerEmail: customer.email || "",
          customerAddress: customer.address || "",
          companyName: userSettings?.companyName || "Công Ty",
          companyAddress: userSettings?.companyAddress || "",
          companyPhone: userSettings?.companyPhone || "",
          companyEmail: userSettings?.companyEmail || "",
          companyTaxId: userSettings?.taxId || "",
          items: items.map(item => ({
            name: item.name,
            quantity: typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity,
            unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
            taxAmount: typeof item.taxAmount === "string" ? parseFloat(item.taxAmount || "0") : (item.taxAmount || 0),
            totalAmount: typeof item.totalAmount === "string" ? parseFloat(item.totalAmount) : item.totalAmount,
          })),
          subtotal: typeof inv.subtotal === "string" ? parseFloat(inv.subtotal) : inv.subtotal,
          taxAmount: typeof inv.taxAmount === "string" ? parseFloat(inv.taxAmount) : (inv.taxAmount || 0),
          discountAmount: typeof inv.discountAmount === "string" ? parseFloat(inv.discountAmount) : (inv.discountAmount || 0),
          totalAmount: typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : inv.totalAmount,
          currency: inv.currency || "VND",
          notes: inv.notes || undefined,
          paymentUrl: inv.paymentUrl || undefined,
        });
        return { success: true, buffer: pdfBuffer.toString("base64"), filename: `${inv.invoiceNumber}.pdf` };
      }),
    // Customer: cancel a CREATED order (called when user cancels PayOS payment)
    cancelByCustomer: publicProcedure
      .input(z.object({ token: z.string(), orderCode: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { customerSessions, customers, invoices: invoicesTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Verify session
        const session = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session[0]) throw new TRPCError({ code: "UNAUTHORIZED" });
        // Find customer
        const customerRow = await drizzleDb.select().from(customers).where(eq(customers.email, session[0].email)).limit(1);
        if (!customerRow[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy khách hàng" });
        // Find the invoice by orderCode and customer
        const invoice = await drizzleDb.select().from(invoicesTable)
          .where(and(
            eq((invoicesTable as any).payosOrderCode, input.orderCode),
            eq(invoicesTable.customerId, customerRow[0].id)
          ))
          .limit(1);
        if (!invoice[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy đơn hàng" });
        if (invoice[0].status !== "CREATED") {
          // Already processed - return current status
          return { success: true, status: invoice[0].status };
        }
        // Mark as CANCELLED
        await drizzleDb.update(invoicesTable)
          .set({ status: "CANCELLED" } as any)
          .where(eq(invoicesTable.id, invoice[0].id));
        return { success: true, status: "CANCELLED" };
      }),
  }),
  // Customers
  customers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getCustomersByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const customer = await db.getCustomerById(input.id);
        if (!customer || customer.userId !== ctx.user.id) {
          throw new Error("Customer not found");
        }
        return customer;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          address: z.string().optional(),
          taxId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createCustomer({
          ...input,
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          taxId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const customer = await db.getCustomerById(input.id);
        if (!customer || customer.userId !== ctx.user.id) {
          throw new Error("Customer not found");
        }
        const { id, ...updateData } = input;
        await db.updateCustomer(id, {
          ...updateData,
          updatedAt: new Date(),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const customer = await db.getCustomerById(input.id);
        if (!customer || customer.userId !== ctx.user.id) {
          throw new Error("Customer not found");
        }
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
    updateRole: protectedProcedure
      .input(z.object({
        id: z.number(),
        customerRole: z.enum(["customer", "vip", "wholesale", "partner"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customers: customersTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const customer = await db.getCustomerById(input.id);
        if (!customer || customer.userId !== ctx.user.id) throw new Error("Customer not found");
        await drizzleDb.update(customersTable).set({ customerRole: input.customerRole, updatedAt: new Date() } as any).where(eq(customersTable.id, input.id));
        return { success: true };
      }),
    adminSearch: protectedProcedure
      .input(z.object({ search: z.string().min(1) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { or, like } = await import("drizzle-orm");
        const { customers: customersTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        return drizzleDb.select({
          id: customersTable.id,
          email: customersTable.email,
          name: customersTable.name,
          walletBalance: customersTable.walletBalance,
        }).from(customersTable)
          .where(or(
            like(customersTable.email, `%${input.search}%`),
            like(customersTable.name, `%${input.search}%`)
          ))
          .limit(20);
      }),
    adminGetDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { eq, desc } = await import("drizzle-orm");
        const { customers: customersTable, walletTransactions, customerSessions, invoices: invoicesTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const customerRows = await drizzleDb.select().from(customersTable).where(eq(customersTable.id, input.id)).limit(1);
        if (!customerRows[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const customer = customerRows[0];
        // Recent wallet transactions
        const recentTransactions = await drizzleDb.select().from(walletTransactions)
          .where(eq(walletTransactions.customerEmail, customer.email || ""))
          .orderBy(desc(walletTransactions.createdAt))
          .limit(10);
        // Active sessions
        const sessions = await drizzleDb.select().from(customerSessions)
          .where(eq(customerSessions.email, customer.email || ""))
          .orderBy(desc(customerSessions.createdAt))
          .limit(5);
        // Recent invoices
        const recentInvoices = await drizzleDb.select().from(invoicesTable)
          .where(eq(invoicesTable.customerId, input.id))
          .orderBy(desc(invoicesTable.createdAt))
          .limit(5);
        return { customer, recentTransactions, sessions, recentInvoices };
      }),
    adminUpdate: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        customerRole: z.enum(["customer", "vip", "wholesale", "partner"]).optional(),
        emailVerified: z.boolean().optional(),
        walletBalance: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customers: customersTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updateData } = input;
        await drizzleDb.update(customersTable).set({ ...updateData, updatedAt: new Date() } as any).where(eq(customersTable.id, id));
        return { success: true };
      }),
    adminResetPassword: protectedProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customers: customersTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const bcrypt = await import("bcrypt");
        const hash = await bcrypt.hash(input.newPassword, 10);
        await drizzleDb.update(customersTable).set({ passwordHash: hash, updatedAt: new Date() } as any).where(eq(customersTable.id, input.id));
        return { success: true };
      }),
    adminToggleLock: protectedProcedure
      .input(z.object({ id: z.number(), lock: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customers: customersTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const lockedUntil = input.lock ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
        await drizzleDb.update(customersTable).set({ lockedUntil, updatedAt: new Date() } as any).where(eq(customersTable.id, input.id));
        return { success: true };
      }),
  }),
  // Productss
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { products: productsTable, productPackages, productCategories, productTags, productTagMappings } = await import("../drizzle/schema");
      const { eq, inArray } = await import("drizzle-orm");
      const productRows = await drizzleDb.select().from(productsTable).where(eq(productsTable.userId, ctx.user.id)).orderBy(productsTable.createdAt);
      const productIds = productRows.map(p => p.id);
      let allPackages: any[] = [];
      if (productIds.length > 0) {
        allPackages = await drizzleDb.select().from(productPackages)
          .where(inArray(productPackages.productId, productIds))
          .orderBy(productPackages.sortOrder);
      }
      // Get all categories
      const allCategories = await drizzleDb.select().from(productCategories).where(eq(productCategories.userId, ctx.user.id));
      // Get all tag mappings + tags for these products
      let allTagMappings: any[] = [];
      let allTagsList: any[] = [];
      if (productIds.length > 0) {
        allTagMappings = await drizzleDb.select().from(productTagMappings).where(inArray(productTagMappings.productId, productIds));
        const tagIds = Array.from(new Set(allTagMappings.map((m: any) => m.tagId)));
        if (tagIds.length > 0) {
          allTagsList = await drizzleDb.select().from(productTags).where(inArray(productTags.id, tagIds));
        }
      }
      return productRows.map(p => ({
        ...p,
        packages: allPackages.filter(pkg => pkg.productId === p.id),
        categoryName: allCategories.find(c => c.id === p.categoryId)?.name || null,
        parentCategoryName: (() => {
          const cat = allCategories.find(c => c.id === p.categoryId);
          if (!cat?.parentId) return null;
          return allCategories.find(c => c.id === cat.parentId)?.name || null;
        })(),
        tags: allTagMappings.filter((m: any) => m.productId === p.id).map((m: any) => allTagsList.find((t: any) => t.id === m.tagId)).filter(Boolean),
      }));
    }),

    // Public: lấy 1 sản phẩm theo id (không cần auth)
    getPublic: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const { products: productsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [product] = await drizzleDb.select().from(productsTable).where(eq(productsTable.id, input.id)).limit(1);
        if (!product) return null;
        return product;
      }),

    // Public: lấy sản phẩm của owner (single-tenant, userId=1) kèm packages + category
    listPublic: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { products: productsTable, productPackages, productCategories, users, productTags, productTagMappings, productReviews, invoiceItems, invoices } = await import("../drizzle/schema");
        const { eq, and, inArray, avg, count, sum, sql } = await import("drizzle-orm");
        const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner) return [];
        const conditions: any[] = [eq(productsTable.userId, owner.id)];
        if (input?.categoryId) conditions.push(eq(productsTable.categoryId, input.categoryId));
        const productRows = await drizzleDb.select().from(productsTable).where(and(...conditions)).orderBy(productsTable.createdAt);
        const productIds = productRows.map(p => p.id);
        let allPackages: any[] = [];
        if (productIds.length > 0) {
          allPackages = await drizzleDb.select().from(productPackages)
            .where(and(inArray(productPackages.productId, productIds), eq(productPackages.isActive, true)))
            .orderBy(productPackages.sortOrder);
        }
        // Get categories
        const allCategories = await drizzleDb.select().from(productCategories).where(eq(productCategories.userId, owner.id));
        // Get tags for products
        let allTagMappings: any[] = [];
        let allTagsList: any[] = [];
        if (productIds.length > 0) {
          allTagMappings = await drizzleDb.select().from(productTagMappings).where(inArray(productTagMappings.productId, productIds));
          const tagIds = Array.from(new Set(allTagMappings.map((m: any) => m.tagId)));
          if (tagIds.length > 0) {
            allTagsList = await drizzleDb.select().from(productTags).where(inArray(productTags.id, tagIds));
          }
        }
        // Get sold count per product from PAID/COMPLETED invoices
        let soldStats: { productId: number; soldCount: number }[] = [];
        if (productIds.length > 0) {
          const soldRows = await drizzleDb
            .select({
              productId: invoiceItems.productId,
              soldCount: count(invoiceItems.id),
            })
            .from(invoiceItems)
            .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
            .where(and(
              inArray(invoiceItems.productId, productIds),
              sql`${invoices.status} IN ('PAID','SHIPPING','COMPLETED','WARRANTY')`
            ))
            .groupBy(invoiceItems.productId);
          soldStats = soldRows.map((r: any) => ({
            productId: r.productId,
            soldCount: Number(r.soldCount || 0),
          }));
        }
        // Get review stats per product
        let reviewStats: { productId: number; avgRating: number; reviewCount: number }[] = [];
        if (productIds.length > 0) {
          const rows = await drizzleDb
            .select({
              productId: productReviews.productId,
              avgRating: avg(productReviews.rating),
              reviewCount: count(productReviews.id),
            })
            .from(productReviews)
            .where(and(inArray(productReviews.productId, productIds), eq(productReviews.isApproved, true)))
            .groupBy(productReviews.productId);
          reviewStats = rows.map((r: any) => ({
            productId: r.productId,
            avgRating: parseFloat(r.avgRating || "0"),
            reviewCount: Number(r.reviewCount || 0),
          }));
        }
        return productRows.map(p => ({
          ...p,
          packages: allPackages.filter(pkg => pkg.productId === p.id),
          categoryName: allCategories.find(c => c.id === p.categoryId)?.name || null,
          parentCategoryName: (() => {
            const cat = allCategories.find(c => c.id === p.categoryId);
            if (!cat?.parentId) return null;
            return allCategories.find(c => c.id === cat.parentId)?.name || null;
          })(),
          tags: allTagMappings.filter((m: any) => m.productId === p.id).map((m: any) => allTagsList.find((t: any) => t.id === m.tagId)).filter(Boolean),
          avgRating: reviewStats.find(r => r.productId === p.id)?.avgRating || 0,
          reviewCount: reviewStats.find(r => r.productId === p.id)?.reviewCount || 0,
          soldCount: soldStats.find((s: any) => s.productId === p.id)?.soldCount || 0,
        }));
      }),
    // Public: lấy 1 sản phẩm kèm packages theo id
    getPublicById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const { products: productsTable, productPackages, productCategories } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [product] = await drizzleDb.select().from(productsTable).where(eq(productsTable.id, input.id)).limit(1);
        if (!product) return null;
        const packages = await drizzleDb.select().from(productPackages)
          .where(and(eq(productPackages.productId, input.id), eq(productPackages.isActive, true)))
          .orderBy(productPackages.sortOrder);
        // Fetch category info including parent
        let categoryInfo: { name: string; icon: string | null; parentName: string | null; parentIcon: string | null } | null = null;
        if (product.categoryId) {
          const allCats = await drizzleDb.select().from(productCategories);
          const cat = allCats.find(c => c.id === product.categoryId);
          if (cat) {
            const parent = cat.parentId ? allCats.find(c => c.id === cat.parentId) : null;
            categoryInfo = {
              name: cat.name,
              icon: cat.icon,
              parentName: parent?.name || null,
              parentIcon: parent?.icon || null,
            };
          }
        }
        // Count total sold (from orders)
        let totalSold = 0;
        try {
          const { invoiceItems, invoices } = await import("../drizzle/schema");
          const allInvoices = await drizzleDb.select().from(invoices).where(eq(invoices.status, "PAID"));
          const paidIds = allInvoices.map(inv => inv.id);
          if (paidIds.length > 0) {
            const allItems = await drizzleDb.select().from(invoiceItems);
            totalSold = allItems.filter(item => paidIds.includes(item.invoiceId) && item.productId === input.id)
              .reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
          }
        } catch { /* ignore */ }
        return { ...product, packages, categoryInfo, totalSold };
      }),

    getRelated: publicProcedure
      .input(z.object({ productId: z.number(), categoryId: z.number().nullable().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { products: productsTable, productPackages } = await import("../drizzle/schema");
        const { eq, ne, and, isNotNull } = await import("drizzle-orm");
        const limit = input.limit || 8;
        let related: any[] = [];
        // First try same category
        if (input.categoryId) {
          related = await drizzleDb.select().from(productsTable)
            .where(and(
              ne(productsTable.id, input.productId),
              eq(productsTable.categoryId, input.categoryId),
              isNotNull(productsTable.imageUrl)
            ))
            .limit(limit);
        }
        // If not enough, fill with other products from same user
        if (related.length < limit) {
          const [currentProduct] = await drizzleDb.select({ userId: productsTable.userId })
            .from(productsTable).where(eq(productsTable.id, input.productId)).limit(1);
          if (currentProduct) {
            const moreProducts = await drizzleDb.select().from(productsTable)
              .where(and(
                ne(productsTable.id, input.productId),
                eq(productsTable.userId, currentProduct.userId)
              ))
              .limit(limit);
            // Merge without duplicates
            const existingIds = new Set(related.map((p: any) => p.id));
            for (const p of moreProducts) {
              if (!existingIds.has(p.id)) { related.push(p); existingIds.add(p.id); }
              if (related.length >= limit) break;
            }
          }
        }
        // Attach min price from packages
        const productIds = related.map((p: any) => p.id);
        let pricesMap: Record<number, number> = {};
        if (productIds.length > 0) {
          const { inArray } = await import("drizzle-orm");
          const pkgs = await drizzleDb.select().from(productPackages)
            .where(and(inArray(productPackages.productId, productIds), eq(productPackages.isActive, true)));
          let maxPricesMap: Record<number, number> = {};
          pkgs.forEach((pkg: any) => {
            const price = Number(pkg.price);
            if (!pricesMap[pkg.productId] || price < pricesMap[pkg.productId]) {
              pricesMap[pkg.productId] = price;
            }
            if (!maxPricesMap[pkg.productId] || price > maxPricesMap[pkg.productId]) {
              maxPricesMap[pkg.productId] = price;
            }
          });
          return related.map((p: any) => ({ ...p, minPrice: pricesMap[p.id] || null, maxPrice: maxPricesMap[p.id] || null }));
        }
        return related.map((p: any) => ({ ...p, minPrice: pricesMap[p.id] || null, maxPrice: null }));
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found");
        }
        return product;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          categoryId: z.number().nullable().optional(),
          imageUrl: z.string().optional(),
          notes: z.string().optional(),
          inventoryType: z.enum(["manual", "warehouse"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const result = await db.createProduct({
          name: input.name,
          description: input.description,
          categoryId: input.categoryId || null,
          imageUrl: input.imageUrl,
          notes: input.notes,
          inventoryType: input.inventoryType || "manual",
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const insertId = (result as any)?.insertId ?? (result as any)?.[0]?.insertId ?? null;
        return { success: true, id: insertId ? Number(insertId) : null };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().nullable().optional(),
          imageUrl: z.string().optional(),
          notes: z.string().optional(),
          inventoryType: z.enum(["manual", "warehouse"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found");
        }
        const { id, ...updateData } = input;
        await db.updateProduct(id, {
          ...updateData,
          updatedAt: new Date(),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found");
        }
        await db.deleteProduct(input.id);
        return { success: true };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        dataUrl: z.string(), // base64 data URL
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { storagePut } = await import("./storage");
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileName = input.fileName || `product-${ctx.user.id}-${Date.now()}.${ext}`;
        const fileKey = `product-images/${ctx.user.id}/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        return { url };
      }),
    // Packages CRUD
    listPackages: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { productPackages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return drizzleDb.select().from(productPackages)
          .where(eq(productPackages.productId, input.productId))
          .orderBy(productPackages.sortOrder);
      }),
    createPackage: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string(),
        price: z.number(),
        originalPrice: z.number().optional(),
        priceVip: z.number().optional(),
        priceWholesale: z.number().optional(),
        pricePartner: z.number().optional(),
        description: z.string().optional(),
        warrantyMonths: z.number().min(0).optional(),
        deliveryType: z.enum(["manual", "warehouse"]).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const product = await db.getProductById(input.productId);
        if (!product || product.userId !== ctx.user.id) throw new Error("Product not found");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { productPackages } = await import("../drizzle/schema");
        await drizzleDb.insert(productPackages).values({
          productId: input.productId,
          name: input.name,
          price: String(input.price),
          originalPrice: input.originalPrice ? String(input.originalPrice) : null,
          priceVip: input.priceVip ? String(input.priceVip) : null,
          priceWholesale: input.priceWholesale ? String(input.priceWholesale) : null,
          pricePartner: input.pricePartner ? String(input.pricePartner) : null,
          description: input.description,
          warrantyMonths: input.warrantyMonths ?? 0,
          deliveryType: input.deliveryType ?? "manual",
          minStockThreshold: input.minStockThreshold ?? 5,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        });
        return { success: true };
      }),
    updatePackage: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        originalPrice: z.number().nullable().optional(),
        priceVip: z.number().nullable().optional(),
        priceWholesale: z.number().nullable().optional(),
        pricePartner: z.number().nullable().optional(),
        description: z.string().optional(),
        warrantyMonths: z.number().min(0).optional(),
        deliveryType: z.enum(["manual", "warehouse"]).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { productPackages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, price, originalPrice, priceVip, priceWholesale, pricePartner, ...rest } = input;
        const updateData: any = { ...rest };
        if (price !== undefined) updateData.price = String(price);
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice !== null ? String(originalPrice) : null;
        if (priceVip !== undefined) updateData.priceVip = priceVip !== null ? String(priceVip) : null;
        if (priceWholesale !== undefined) updateData.priceWholesale = priceWholesale !== null ? String(priceWholesale) : null;
        if (pricePartner !== undefined) updateData.pricePartner = pricePartner !== null ? String(pricePartner) : null;
        await drizzleDb.update(productPackages).set(updateData).where(eq(productPackages.id, id));
        return { success: true };
      }),
    deletePackage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { productPackages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.delete(productPackages).where(eq(productPackages.id, input.id));
        return { success: true };
      }),
    // Toggle featured
    toggleFeatured: protectedProcedure
      .input(z.object({ id: z.number(), isFeatured: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { products: productsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await drizzleDb.update(productsTable).set({ isFeatured: input.isFeatured } as any).where(eq(productsTable.id, input.id));
        return { success: true };
      }),
    // List featured products (public)
    listFeatured: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { products: productsTable, productPackages, productCategories, users } = await import("../drizzle/schema");
      const { eq, and, inArray } = await import("drizzle-orm");
      const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner) return [];
      const productRows = await drizzleDb.select().from(productsTable).where(and(eq(productsTable.userId, owner.id), eq(productsTable.isFeatured as any, true)));
      const productIds = productRows.map(p => p.id);
      let allPackages: any[] = [];
      if (productIds.length > 0) {
        allPackages = await drizzleDb.select().from(productPackages).where(and(inArray(productPackages.productId, productIds), eq(productPackages.isActive, true))).orderBy(productPackages.sortOrder);
      }
      const allCategories = await drizzleDb.select().from(productCategories).where(eq(productCategories.userId, owner.id));
      return productRows.map(p => ({
        ...p,
        packages: allPackages.filter(pkg => pkg.productId === p.id),
        categoryName: allCategories.find(c => c.id === p.categoryId)?.name || null,
      }));
    }),
    // Custom fields CRUD
    getCustomFields: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const rows = await drizzleDb.select().from(productCustomFields).where(eq(productCustomFields.productId, input.productId)).orderBy(asc(productCustomFields.sortOrder));
      return rows.map(r => ({
        ...r,
        options: r.options ? (() => { try { return JSON.parse(r.options as string); } catch { return []; } })() : [],
      }));
    }),
    createCustomField: protectedProcedure.input(z.object({
      productId: z.number(),
      fieldName: z.string().min(1).optional(),
      fieldValue: z.string().optional(),
      sortOrder: z.number().optional(),
      // Extended fields
      label: z.string().optional(),
      fieldType: z.string().optional(),
      placeholder: z.string().optional(),
      description: z.string().optional(),
      options: z.array(z.string()).optional(),
      isRequired: z.boolean().optional(),
      isVisible: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const product = await db.getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const fieldName = input.fieldName || input.label || "field";
      await drizzleDb.insert(productCustomFields).values({
        productId: input.productId,
        fieldName,
        fieldValue: input.fieldValue || null,
        sortOrder: input.sortOrder || 0,
        label: input.label || fieldName,
        fieldType: input.fieldType || "text",
        placeholder: input.placeholder || null,
        description: input.description || null,
        options: input.options ? JSON.stringify(input.options) : null,
        isRequired: input.isRequired ?? false,
        isVisible: input.isVisible ?? true,
      });
      return { success: true };
    }),
    updateCustomField: protectedProcedure.input(z.object({
      id: z.number(),
      fieldName: z.string().optional(),
      fieldValue: z.string().optional(),
      sortOrder: z.number().optional(),
      // Extended fields
      label: z.string().optional(),
      fieldType: z.string().optional(),
      placeholder: z.string().optional(),
      description: z.string().optional(),
      options: z.array(z.string()).optional(),
      isRequired: z.boolean().optional(),
      isVisible: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { id, options, ...rest } = input;
      const updates: any = { ...rest };
      if (options !== undefined) updates.options = JSON.stringify(options);
      await drizzleDb.update(productCustomFields).set(updates).where(eq(productCustomFields.id, id));
      return { success: true };
    }),
    deleteCustomField: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(productCustomFields).where(eq(productCustomFields.id, input.id));
      return { success: true };
    }),
    // Product reviews
    getReviews: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      const { productReviews, customers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Join with customers (1 row per email) to get avatarUrl - avoids row duplication from customerSessions
      const rows = await drizzleDb
        .select({
          id: productReviews.id,
          productId: productReviews.productId,
          customerEmail: productReviews.customerEmail,
          customerName: productReviews.customerName,
          rating: productReviews.rating,
          comment: productReviews.comment,
          invoiceId: productReviews.invoiceId,
          isApproved: productReviews.isApproved,
          createdAt: productReviews.createdAt,
          adminReply: (productReviews as any).adminReply,
          avatarUrl: customers.avatarUrl,
        })
        .from(productReviews)
        .leftJoin(customers, eq(customers.email, productReviews.customerEmail))
        .where(and(eq(productReviews.productId, input.productId), eq(productReviews.isApproved, true)))
        .orderBy(desc(productReviews.createdAt));
      return rows;
    }),
    submitReview: publicProcedure.input(z.object({
      productId: z.number(),
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      invoiceId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(productReviews).values({ productId: input.productId, customerEmail: input.customerEmail, customerName: input.customerName || null, rating: input.rating, comment: input.comment || null, invoiceId: input.invoiceId || null, isApproved: false });
      return { success: true };
    }),
    getAllReviews: protectedProcedure.input(z.object({ productId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const { productReviews, customers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc, eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const conditions: any[] = [];
      if (input?.productId) conditions.push(eq(productReviews.productId, input.productId));
      // Join with customers to get customerName fallback and avoid duplicate rows
      const rows = await drizzleDb
        .select({
          id: productReviews.id,
          productId: productReviews.productId,
          customerEmail: productReviews.customerEmail,
          customerName: productReviews.customerName,
          rating: productReviews.rating,
          comment: productReviews.comment,
          invoiceId: productReviews.invoiceId,
          isApproved: productReviews.isApproved,
          adminReply: (productReviews as any).adminReply,
          repliedAt: (productReviews as any).repliedAt,
          createdAt: productReviews.createdAt,
          avatarUrl: customers.avatarUrl,
        })
        .from(productReviews)
        .leftJoin(customers, eq(customers.email, productReviews.customerEmail))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(productReviews.createdAt));
      return rows;
    }),
    approveReview: protectedProcedure.input(z.object({ id: z.number(), isApproved: z.boolean() })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.update(productReviews).set({ isApproved: input.isApproved }).where(eq(productReviews.id, input.id));
      return { success: true };
    }),
    deleteReview: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(productReviews).where(eq(productReviews.id, input.id));
      return { success: true };
    }),
    replyReview: protectedProcedure.input(z.object({ id: z.number(), adminReply: z.string() })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.update(productReviews)
        .set({ adminReply: input.adminReply || null, repliedAt: input.adminReply ? new Date() : null } as any)
        .where(eq(productReviews.id, input.id));
      return { success: true };
    }),
    // Public: get product review info by per-product token
    getByProductToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { invoiceItems, invoices, products: productsTable } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const [item] = await drizzleDb.select().from(invoiceItems).where(eq((invoiceItems as any).productReviewToken, input.token)).limit(1);
      if (!item) return null;
      const [invoice] = await drizzleDb.select().from(invoices).where(eq(invoices.id, item.invoiceId)).limit(1);
      const [product] = item.productId ? await drizzleDb.select({ id: productsTable.id, name: productsTable.name, imageUrl: productsTable.imageUrl }).from(productsTable).where(eq(productsTable.id, item.productId)).limit(1) : [null];
      return {
        itemId: item.id,
        productId: item.productId,
        productName: product?.name || item.name,
        productImageUrl: (product as any)?.imageUrl || null,
        invoiceNumber: invoice?.invoiceNumber || "",
        reviewSubmitted: !!(item as any).productReviewSubmitted,
      };
    }),
    // Public: submit product review by per-product token
    submitByProductToken: publicProcedure.input(z.object({
      token: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      customerName: z.string().optional(),
      customerEmail: z.string().email().optional(),
    })).mutation(async ({ input }) => {
      const { invoiceItems, invoices, productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const [item] = await drizzleDb.select().from(invoiceItems).where(eq((invoiceItems as any).productReviewToken, input.token)).limit(1);
      if (!item) throw new Error("Link đánh giá không hợp lệ");
      if ((item as any).productReviewSubmitted) throw new Error("Sản phẩm này đã được đánh giá");
      if (!item.productId) throw new Error("Sản phẩm không tồn tại");
      const [invoice] = await drizzleDb.select().from(invoices).where(eq(invoices.id, item.invoiceId)).limit(1);
      const customer = invoice?.customerId ? await db.getCustomerById(invoice.customerId) : null;
      await drizzleDb.insert(productReviews).values({
        productId: item.productId,
        customerEmail: input.customerEmail || customer?.email || "",
        customerName: input.customerName || customer?.name || "Khách Hàng",
        rating: input.rating,
        comment: input.comment || null,
        invoiceId: item.invoiceId,
        isApproved: false,
      });
      await drizzleDb.update(invoiceItems).set({ productReviewSubmitted: true } as any).where(eq(invoiceItems.id, item.id));
      return { success: true };
    }),
  }),
  // Taxes
  taxes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getTaxesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          rate: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createTax({
          ...input,
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // Discount Codes
  discountCodes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getDiscountCodesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          code: z.string(),
          discountPercent: z.number(),
          maxUses: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createDiscountCode({
          ...input,
          userId: ctx.user.id,
          usedCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // Invoice Templates
  invoiceTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getInvoiceTemplatesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = await db.getInvoiceTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new Error("Template not found");
        }
        return template;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
       .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const result = await db.createInvoiceTemplate({
          ...input,
          userId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }) as any;
        const insertId = result?.insertId || result?.[0]?.insertId;
        return { success: true, id: insertId ? Number(insertId) : undefined };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
          headerColor: z.string().optional(),
          footerColor: z.string().optional(),
          textColor: z.string().optional(),
          accentColor: z.string().optional(),
          font: z.string().optional(),
          fontSize: z.string().optional(),
          companyName: z.string().optional(),
          companyAddress: z.string().optional(),
          companyPhone: z.string().optional(),
          companyEmail: z.string().optional(),
          companyTaxId: z.string().optional(),
          footerText: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = await db.getInvoiceTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new Error("Template not found");
        }
        const { id, ...updateData } = input;
        await db.updateInvoiceTemplate(id, {
          ...updateData,
          updatedAt: new Date(),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = await db.getInvoiceTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) {
          throw new Error("Template not found");
        }
        await db.deleteInvoiceTemplate(input.id);
        return { success: true };
      }),
  }),

  // Payment Gateways Config
  paymentGateways: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const config = await db.getPaymentGatewaysConfigByUserId(ctx.user.id);
      return config ?? null;
    }),

    update: protectedProcedure
      .input(
        z.object({
          payosApiKey: z.string().optional(),
          payosClientId: z.string().optional(),
          payosChecksumKey: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const config = await db.getPaymentGatewaysConfigByUserId(ctx.user.id);
        if (config) {
          await db.updatePaymentGatewayConfig(config.id, {
            ...input,
            updatedAt: new Date(),
          });
        } else {
          await db.createPaymentGatewayConfig({
            ...input,
            userId: ctx.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return { success: true };
      }),
    testConnection: protectedProcedure
      .input(z.object({ gateway: z.enum(["payos"]) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const config = await db.getPaymentGatewaysConfigByUserId(ctx.user.id);
        if (!config) return { success: false, message: "Chưa có cấu hình" };
        
        if (input.gateway === "payos") {
          if (!config.payosApiKey || !config.payosClientId || !config.payosChecksumKey) {
            return { success: false, message: "Thiếu thông tin cấu hình PayOS" };
          }
          try {
            const res = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
              method: "GET",
              headers: {
                "x-client-id": config.payosClientId,
                "x-api-key": config.payosApiKey,
              },
              signal: AbortSignal.timeout(5000),
            });
            const ok = res.status !== 401 && res.status !== 403;
            return { success: ok, message: ok ? "Kết nối PayOS thành công" : "API Key không hợp lệ" };
          } catch {
            return { success: false, message: "Không thể kết nối đến PayOS" };
          }
        } else {
          return { success: false, message: "Cổng thanh toán không được hỗ trợ" };
        }
      }),
    testWebhook: protectedProcedure
      .input(z.object({ webhookUrl: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        // Send a test ping to the webhook endpoint
        try {
          const testPayload = {
            code: "00",
            desc: "success",
            success: true,
            data: {
              orderCode: 0,
              amount: 0,
              description: "WEBHOOK TEST",
              accountNumber: "",
              reference: "TEST",
              transactionDateTime: new Date().toISOString(),
              currency: "VND",
              paymentLinkId: "",
              code: "00",
              desc: "Webhook test từ hệ thống",
              counterAccountBankId: null,
              counterAccountBankName: null,
              counterAccountName: null,
              counterAccountNumber: null,
              virtualAccountName: null,
              virtualAccountNumber: null,
            },
            signature: "test-signature",
          };
          const res = await fetch(input.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(8000),
          });
          const ok = res.ok;
          return { success: ok, statusCode: res.status, message: ok ? "Webhook endpoint phản hồi thành công" : `Webhook trả về HTTP ${res.status}` };
        } catch (err: any) {
          return { success: false, statusCode: 0, message: err?.message || "Không thể kết nối đến webhook URL" };
        }
      }),
  }),
  // Reports
  reports: router({
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      
      const totalRevenue = invoices.reduce((sum, inv) => {
        const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
        return sum + amount;
      }, 0);
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === "PAID").length;
      const pendingInvoices = invoices.filter(inv => inv.status !== "PAID" && inv.status !== "EXPIRED").length;
      
      return {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
      };
    }),

    getRevenueByMonth: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      
      const revenueByMonth: Record<string, number> = {};
      invoices.forEach(inv => {
        if (inv.createdAt) {
          const month = new Date(inv.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit" });
          const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
          revenueByMonth[month] = (revenueByMonth[month] || 0) + amount;
        }
      });
      
      return Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    }),

    getInvoiceStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      
      const stats = {
        CREATED: invoices.filter(inv => inv.status === "CREATED").length,
        PAID: invoices.filter(inv => inv.status === "PAID").length,
        SHIPPING: invoices.filter(inv => inv.status === "SHIPPING").length,
        WARRANTY: invoices.filter(inv => inv.status === "WARRANTY").length,
        FAILED: invoices.filter(inv => inv.status === "FAILED").length,
        EXPIRED: invoices.filter(inv => inv.status === "EXPIRED").length,
      };
      
      return stats;
    }),
    getTopCustomers: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      const customers = await db.getCustomersByUserId(ctx.user.id);
      
      // Aggregate revenue by customer
      const revenueByCustomer: Record<number, number> = {};
      invoices.forEach(inv => {
        if (inv.customerId && inv.status === "PAID") {
          const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
          revenueByCustomer[inv.customerId] = (revenueByCustomer[inv.customerId] || 0) + amount;
        }
      });
      
      return customers
        .map(c => ({
          id: c.id,
          name: c.name,
          revenue: revenueByCustomer[c.id] || 0,
          invoiceCount: invoices.filter(inv => inv.customerId === c.id).length,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }),
    getTopProducts: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const products = await db.getProductsByUserId(ctx.user.id);
      return products.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === "string" ? parseFloat(p.price) : (p.price || 0),
        category: p.category || "",
      }));
    }),
    topProductsDaily: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const rows = await db.getTopProductsDaily(ctx.user.id, input.date);
        return rows.map(r => ({
          name: r.name,
          totalQty: Number(r.totalQty) || 0,
          totalRevenue: Number(r.totalRevenue) || 0,
          orderCount: Number(r.orderCount) || 0,
        }));
      }),
    topCustomersByPeriod: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(365).default(7) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const rows = await db.getTopCustomersByPeriod(ctx.user.id, input.days);
        return rows.map(r => ({
          customerId: r.customerId,
          customerName: r.customerName || "Khách hàng",
          customerEmail: r.customerEmail || "",
          orderCount: Number(r.orderCount) || 0,
          totalSpent: Number(r.totalSpent) || 0,
          paidCount: Number(r.paidCount) || 0,
        }));
      }),

    getMonthlyComparison: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      const byMonth: Record<string, { created: number; paid: number; revenue: number }> = {};
      invoices.forEach(inv => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth[key]) byMonth[key] = { created: 0, paid: 0, revenue: 0 };
        byMonth[key].created++;
        if (inv.status === "PAID" || inv.status === "SHIPPING" || inv.status === "WARRANTY") {
          byMonth[key].paid++;
          const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : (inv.totalAmount || 0);
          byMonth[key].revenue += amount;
        }
      });
      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, data]) => ({
          month,
          shortMonth: `T${parseInt(month.split("-")[1])}`,
          created: data.created,
          paid: data.paid,
          revenue: data.revenue,
          conversionRate: data.created > 0 ? Math.round(data.paid / data.created * 100) : 0,
        }));
    }),
    revenueByCustomer: protectedProcedure
      .input(z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoices = await db.getInvoicesByUserIdWithCustomer(ctx.user.id);
        let filtered = invoices.filter(i => i.status && ["PAID","SHIPPING","WARRANTY"].includes(i.status));
        if (input.fromDate) {
          const from = new Date(input.fromDate);
          filtered = filtered.filter(i => new Date(i.createdAt) >= from);
        }
        if (input.toDate) {
          const to = new Date(input.toDate);
          to.setHours(23, 59, 59, 999);
          filtered = filtered.filter(i => new Date(i.createdAt) <= to);
        }
        const byCustomer: Record<number, { customerId: number; customerName: string; orderCount: number; totalRevenue: number }> = {};
        for (const inv of filtered) {
          const cid = inv.customerId ?? 0;
          if (!byCustomer[cid]) byCustomer[cid] = { customerId: cid, customerName: inv.customerName || "Khách lẻ", orderCount: 0, totalRevenue: 0 };
          byCustomer[cid].orderCount++;
          byCustomer[cid].totalRevenue += Number(inv.totalAmount) || 0;
        }
        return Object.values(byCustomer).sort((a, b) => b.totalRevenue - a.totalRevenue);
      }),
    conversionByProduct: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const invoices = await db.getInvoicesByUserId(ctx.user.id);
      const allItems = await Promise.all(invoices.map(i => db.getInvoiceItemsByInvoiceId(i.id)));
      const byProduct: Record<string, { name: string; totalOrders: number; paidOrders: number; totalRevenue: number }> = {};
      invoices.forEach((inv, idx) => {
        const items = allItems[idx];
        const isPaid = inv.status && ["PAID","SHIPPING","WARRANTY"].includes(inv.status);
        items.forEach(item => {
          if (!byProduct[item.name]) byProduct[item.name] = { name: item.name, totalOrders: 0, paidOrders: 0, totalRevenue: 0 };
          byProduct[item.name].totalOrders++;
          if (isPaid) {
            byProduct[item.name].paidOrders++;
            byProduct[item.name].totalRevenue += Number(item.totalAmount) || 0;
          }
        });
      });
      return Object.values(byProduct)
        .map(p => ({ ...p, conversionRate: p.totalOrders > 0 ? Math.round(p.paidOrders / p.totalOrders * 100) : 0 }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 20);
    }),
  }),
  // User Settingss
  settings: router({
    // Public procedure - không cần auth, trả về thông tin công ty cho landing page
    getPublicInfo: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      const { userSettings, invoiceTemplates } = await import("../drizzle/schema");
      if (!drizzleDb) return null;
      // Lấy settings của owner (user đầu tiên trong hệ thống)
      const rows = await drizzleDb.select({
        companyName: userSettings.companyName,
        companyEmail: userSettings.companyEmail,
        companyPhone: userSettings.companyPhone,
        companyAddress: userSettings.companyAddress,
        website: userSettings.website,
        logoUrl: userSettings.logoUrl,
        faviconUrl: userSettings.faviconUrl,
        themeColor: userSettings.themeColor,
        themeColor1: userSettings.themeColor1,
        logoDarkUrl: userSettings.logoDarkUrl,
        fontFamily: userSettings.fontFamily,
        featureCustom404: userSettings.featureCustom404,
        custom404Title: userSettings.custom404Title,
        custom404Message: userSettings.custom404Message,
        custom404ButtonText: userSettings.custom404ButtonText,
        custom404ButtonUrl: userSettings.custom404ButtonUrl,
        custom404ImageUrl: userSettings.custom404ImageUrl,
        custom404BgColor: userSettings.custom404BgColor,
        custom404TextColor: userSettings.custom404TextColor,
        custom404CustomHtml: userSettings.custom404CustomHtml,
      }).from(userSettings).limit(1);
      // Lấy logo từ default template (fallback nếu không có brand logo)
      const templateRows = await drizzleDb.select({
        logo: invoiceTemplates.logo,
      }).from(invoiceTemplates).limit(1);
      const templateLogo = templateRows[0]?.logo ?? null;
      const base = rows[0] ?? { companyName: null, companyEmail: null, companyPhone: null, companyAddress: null, website: null, logoUrl: null, faviconUrl: null };
      // Prefer brand logoUrl over template logo
      const companyLogo = base.logoUrl || templateLogo;
      return { ...base, companyLogo };
    }),
     get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const settings = await db.getUserSettings(ctx.user.id);
      return settings ?? null;
    }),
    updateCompany: protectedProcedure
      .input(z.object({
        companyName: z.string().optional(),
        companyEmail: z.string().email().optional().or(z.literal("")),
        companyPhone: z.string().optional(),
        companyAddress: z.string().optional(),
        taxId: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    updateNotifications: protectedProcedure
      .input(z.object({
        emailNotifications: z.boolean().optional(),
        invoiceReminder: z.boolean().optional(),
        reminderHoursBefore: z.number().int().min(1).max(168).optional(),
        paymentConfirmation: z.boolean().optional(),
        weeklyReport: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(input.currentPassword, user.password);
        if (!valid) throw new Error("Mật khẩu hiện tại không đúng");
        const hashed = await bcrypt.hash(input.newPassword, 10);
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new Error("Database not available");
        const { eq } = await import("drizzle-orm");
        const { users } = await import("../drizzle/schema");
        await drizzleDb.update(users).set({ password: hashed }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    // Upload logo or favicon - accepts base64 data URL
    uploadBrandAsset: protectedProcedure
      .input(z.object({
        type: z.enum(["logo", "favicon"]),
        dataUrl: z.string(), // base64 data URL e.g. "data:image/png;base64,..."
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { storagePut } = await import("./storage");
        // Parse base64 data URL
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        // Determine extension
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileName = input.fileName || `${input.type}-${ctx.user.id}-${Date.now()}.${ext}`;
        const fileKey = `brand-assets/${ctx.user.id}/${input.type}/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        // Save URL to userSettings
        const field = input.type === "logo" ? { logoUrl: url } : { faviconUrl: url };
        await db.upsertUserSettings(ctx.user.id, field);
        return { url };
      }),

    updateBrand: protectedProcedure
      .input(z.object({
        logoUrl: z.string().nullable().optional(),
        faviconUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const data: Record<string, string | null> = {};
        if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
        if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl;
        await db.upsertUserSettings(ctx.user.id, data);
        return { success: true };
      }),
    updateGeneral: protectedProcedure
      .input(z.object({
        siteTitle: z.string().optional(),
        siteDescription: z.string().optional(),
        siteKeywords: z.string().optional(),
        siteAuthor: z.string().optional(),
        siteTimezone: z.string().optional(),
        hotline: z.string().optional(),
        fanpageUrl: z.string().optional(),
        copyrightFooter: z.string().optional(),
        maintenanceMode: z.boolean().optional(),
        autoUpdate: z.boolean().optional(),
        debugMode: z.boolean().optional(),
        debugAutoBank: z.boolean().optional(),
        debugApiSuppliers: z.boolean().optional(),
        fontFamily: z.string().optional(),
        showApiDocs: z.boolean().optional(),
        showAvatar: z.boolean().optional(),
        showTelegramReminder: z.boolean().optional(),
        showSlider: z.boolean().optional(),
        showBanner: z.boolean().optional(),
        showRecentlyViewed: z.boolean().optional(),
        headerScript: z.string().optional(),
        footerScript: z.string().optional(),
        adminFooterScript: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    updateColors: protectedProcedure
      .input(z.object({
        themeColor: z.string().optional(),
        themeColor1: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    uploadBrandAssetExtra: protectedProcedure
      .input(z.object({
        type: z.enum(["logoDark", "siteImage", "avatar"]),
        dataUrl: z.string(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { storagePut } = await import("./storage");
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileName = input.fileName || `${input.type}-${ctx.user.id}-${Date.now()}.${ext}`;
        const fileKey = `brand-assets/${ctx.user.id}/${input.type}/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        const fieldMap: Record<string, string> = { logoDark: "logoDarkUrl", siteImage: "siteImageUrl", avatar: "avatarImageUrl" };
        await db.upsertUserSettings(ctx.user.id, { [fieldMap[input.type]]: url });
        return { url };
      }),

    updatePrimekeySettings: protectedProcedure
      .input(z.object({
        requireLoginToView: z.boolean().optional(),
        showSoldCount: z.boolean().optional(),
        allowProductReview: z.boolean().optional(),
        telegramOrderChatId: z.string().optional(),
        orderCodeType: z.string().optional(),
        orderCodeLength: z.number().int().min(6).max(20).optional(),
        orderCodePrefix: z.string().optional(),
        siteAddress: z.string().optional(),
        siteCopyright: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    updateSecuritySettings: protectedProcedure
      .input(z.object({
        bfMaxLoginAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxAccountAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxApiAttempts: z.number().int().min(1).max(200).optional(),
        bfMax2faAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxOtpAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxTopupAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxPasswordResetAttempts: z.number().int().min(1).max(100).optional(),
        bfMaxApiWhitelistAttempts: z.number().int().min(1).max(200).optional(),
        adminPanelMaxWrongUrl: z.number().int().min(1).max(100).optional(),
        adminSingleIp: z.boolean().optional(),
        adminSingleDevice: z.boolean().optional(),
        clientSingleDevice: z.boolean().optional(),
        adminPanelPath: z.string().optional(),
        showAdminPanelButton: z.boolean().optional(),
        maxRegisterPerIp: z.number().int().min(1).max(10000).optional(),
        sessionDuration: z.number().int().min(300).max(2592000).optional(),
        cronJobSecret: z.string().optional(),
        requireStrongPassword: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    updateFeaturesSettings: protectedProcedure
      .input(z.object({
        featureAvatarGallery: z.boolean().optional(),
        featureThankYou: z.boolean().optional(),
        featureCustom404: z.boolean().optional(),
        featureFlashSale: z.boolean().optional(),
        featureCoupons: z.boolean().optional(),
        featureAffiliate: z.boolean().optional(),
        featureLoyalty: z.boolean().optional(),
        featureBlog: z.boolean().optional(),
        featureWarranty: z.boolean().optional(),
        featureSpinWheel: z.boolean().optional(),
        featureTopup: z.boolean().optional(),
        featureTicket: z.boolean().optional(),
        featureReview: z.boolean().optional(),
        featureCart: z.boolean().optional(),
        featureWishlist: z.boolean().optional(),
        featureCompare: z.boolean().optional(),
        featureLeaderboard: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        // Sync to featureFlags table so useFeatureFlags() hook picks up changes
        const { featureFlags } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (drizzleDb) {
          const mapping: Record<string, string> = {
            featureAvatarGallery: "avatarGallery",
            featureFlashSale: "flash_sale",
            featureCoupons: "coupon",
            featureAffiliate: "referral",
            featureLoyalty: "points",
            featureBlog: "blog",
            featureWarranty: "warranty",
            featureSpinWheel: "spin_wheel",
            featureTopup: "wallet",
            featureTicket: "ticket",
            featureReview: "review",
            featureCart: "cart",
            featureWishlist: "wishlist",
            featureCompare: "compare",
            featureLeaderboard: "leaderboard",
          };
          for (const [settingKey, flagKey] of Object.entries(mapping)) {
            const val = (input as Record<string, boolean | undefined>)[settingKey];
            if (val !== undefined) {
              // Upsert: update if exists, insert if not
              const existing = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.key, flagKey));
              if (existing.length > 0) {
                await drizzleDb.update(featureFlags).set({ enabled: val }).where(eq(featureFlags.key, flagKey));
              } else {
                await drizzleDb.insert(featureFlags).values({ key: flagKey, label: settingKey, description: "", enabled: val, category: "feature" });
              }
            }
          }
        }
        return { success: true };
      }),
    updateTaxSettings: protectedProcedure
      .input(z.object({
        taxEnabled: z.boolean().optional(),
        taxName: z.string().max(50).optional(),
        taxRate: z.number().int().min(0).max(100).optional(),
        taxIncluded: z.boolean().optional(),
        taxNumber: z.string().max(50).optional(),
        taxCompanyName: z.string().max(255).optional(),
        taxAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    updateCustom404: protectedProcedure
      .input(z.object({
        custom404Title: z.string().max(255).optional(),
        custom404Message: z.string().optional(),
        custom404ButtonText: z.string().max(100).optional(),
        custom404ButtonUrl: z.string().max(500).optional(),
        custom404ImageUrl: z.string().optional(),
        custom404BgColor: z.string().max(20).optional(),
        custom404TextColor: z.string().max(20).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    // Lấy thông tin hệ thống cho Dashboard (license, version, update)
    getSystemInfo: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getCurrentLicense } = await import("./license");
      const licenseInfo = getCurrentLicense();
      const settings = await db.getUserSettings(ctx.user.id);
      const APP_VERSION = process.env.APP_VERSION || "1.0.0";
      const licenseKey = process.env.LICENSE_KEY || null;
      // Check for updates (nếu có UPDATE_CHECK_URL)
      let latestVersion: string | null = null;
      let updateAvailable = false;
      const updateCheckUrl = process.env.UPDATE_CHECK_URL;
      if (updateCheckUrl) {
        try {
          const resp = await fetch(`${updateCheckUrl}/api/latest-version`, { signal: AbortSignal.timeout(5000) });
          if (resp.ok) {
            const data = await resp.json() as { version?: string };
            latestVersion = data.version || null;
            if (latestVersion && latestVersion !== APP_VERSION) updateAvailable = true;
          }
        } catch { /* ignore */ }
      }
      return {
        appVersion: APP_VERSION,
        appName: settings?.companyName || "",
        licenseKey: licenseKey ? `${licenseKey.substring(0, 8)}...` : null,
        licenseValid: licenseInfo?.valid ?? true,
        licensePlan: licenseInfo?.plan ?? "development",
        licenseExpiresAt: licenseInfo?.expiresAt ?? null,
        licenseMessage: licenseInfo?.message ?? null,
        autoUpdate: settings?.autoUpdate ?? false,
        updateAvailable,
        latestVersion,
        maintenanceMode: settings?.maintenanceMode ?? false,
      };
    }),

    // Upload banner for thank-you page
    uploadThankYouBanner: protectedProcedure
      .input(z.object({
        dataUrl: z.string(), // base64 data URL
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { storagePut } = await import("./storage");
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileName = input.fileName || `thank-you-banner-${ctx.user.id}-${Date.now()}.${ext}`;
        const fileKey = `thank-you-banners/${ctx.user.id}/${fileName}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        await db.upsertUserSettings(ctx.user.id, { thankYouBannerUrl: url });
        return { url };
      }),
  }),

  // Feature Flags - bật/tắt tính năng client
  featureFlags: router({
    // Public: client lấy danh sách feature flags
    getAll: publicProcedure.query(async () => {
      const { featureFlags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Seed default flags if empty
      const existing = await drizzleDb.select().from(featureFlags);
      if (existing.length === 0) {
        const defaults = [
          { key: "points", label: "Điểm thưởng", description: "Hệ thống tích điểm và đổi thưởng cho khách hàng", enabled: true, category: "loyalty" },
          { key: "warranty", label: "Bảo hành", description: "Tính năng bảo hành sản phẩm và yêu cầu bảo hành", enabled: true, category: "service" },
          { key: "referral", label: "Giới thiệu bạn bè", description: "Chương trình giới thiệu bạn bè và hoa hồng", enabled: true, category: "marketing" },
          { key: "flash_sale", label: "Flash Sale", description: "Tính năng flash sale và đếm ngược khuyến mãi", enabled: true, category: "marketing" },
          { key: "wishlist", label: "Yêu thích", description: "Danh sách sản phẩm yêu thích của khách hàng", enabled: true, category: "ux" },
          { key: "leaderboard", label: "Bảng xếp hạng", description: "Bảng xếp hạng khách hàng mua nhiều nhất", enabled: true, category: "gamification" },
          { key: "blog", label: "Blog / Tin tức", description: "Trang blog và bài viết tin tức", enabled: true, category: "content" },
          { key: "coupon", label: "Mã giảm giá", description: "Kho mã giảm giá và voucher", enabled: true, category: "marketing" },
          { key: "wallet", label: "Ví điện tử", description: "Ví điện tử và nạp tiền", enabled: true, category: "payment" },
          { key: "review", label: "Đánh giá sản phẩm", description: "Hệ thống đánh giá và nhận xét sản phẩm", enabled: true, category: "ux" },
          { key: "ticket", label: "Ticket hỗ trợ", description: "Hệ thống gửi yêu cầu hỗ trợ", enabled: true, category: "service" },
          { key: "cart", label: "Giỏ hàng", description: "Giỏ hàng mua sắm", enabled: true, category: "ux" },
          { key: "wishlist", label: "Yêu thích", description: "Danh sách sản phẩm yêu thích", enabled: true, category: "ux" },
        ];
        await drizzleDb.insert(featureFlags).values(defaults);
        return drizzleDb.select().from(featureFlags);
      }
      return existing;
    }),
    // Admin: cập nhật trạng thái bật/tắt
    update: protectedProcedure
      .input(z.object({ key: z.string(), enabled: z.boolean() }))
      .mutation(async ({ input }) => {
        const { featureFlags } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB not available");
        await drizzleDb.update(featureFlags).set({ enabled: input.enabled }).where(eq(featureFlags.key, input.key));
        return { success: true };
      }),
    // Admin: bulk update
    bulkUpdate: protectedProcedure
      .input(z.array(z.object({ key: z.string(), enabled: z.boolean() })))
      .mutation(async ({ input }) => {
        const { featureFlags } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB not available");
        for (const item of input) {
          await drizzleDb.update(featureFlags).set({ enabled: item.enabled }).where(eq(featureFlags.key, item.key));
        }
        return { success: true };
      }),
  }),
  // PDF Export
  pdf: router({
    exportInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        
        // Fetch real invoice items, customer, and company settings
        const [invoiceItemsData, customer, userSettings] = await Promise.all([
          db.getInvoiceItemsByInvoiceId(input.invoiceId),
          invoice.customerId ? db.getCustomerById(invoice.customerId) : Promise.resolve(undefined),
          db.getUserSettings(ctx.user.id),
        ]);
        
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.createdAt,
          dueDate: invoice.expiresAt || undefined,
          customerName: customer?.name || "Khách Hàng",
          customerEmail: customer?.email || "",
          customerAddress: customer?.address || "",
          companyName: userSettings?.companyName || "Công Ty",
          companyAddress: userSettings?.companyAddress || "",
          companyPhone: userSettings?.companyPhone || "",
          companyEmail: userSettings?.companyEmail || "",
          companyTaxId: userSettings?.taxId || "",
          items: invoiceItemsData.map(item => ({
            name: item.name,
            quantity: typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity,
            unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
            taxAmount: typeof item.taxAmount === "string" ? parseFloat(item.taxAmount || "0") : (item.taxAmount || 0),
            totalAmount: typeof item.totalAmount === "string" ? parseFloat(item.totalAmount) : item.totalAmount,
          })),
          subtotal: typeof invoice.subtotal === "string" ? parseFloat(invoice.subtotal) : invoice.subtotal,
          taxAmount: typeof invoice.taxAmount === "string" ? parseFloat(invoice.taxAmount) : (invoice.taxAmount || 0),
          discountAmount: typeof invoice.discountAmount === "string" ? parseFloat(invoice.discountAmount) : (invoice.discountAmount || 0),
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          notes: invoice.notes || undefined,
          paymentUrl: invoice.paymentUrl || undefined,
        });
        
        return {
          success: true,
          buffer: pdfBuffer.toString("base64"),
          filename: `${invoice.invoiceNumber}.pdf`,
        };
      }),
    previewInvoice: protectedProcedure
      .input(z.object({
        invoiceNumber: z.string(),
        dueDate: z.date().optional(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerAddress: z.string().optional(),
        currency: z.enum(["VND", "USD"]),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          taxRate: z.number(),
        })),
        discountPercent: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const userSettings = await db.getUserSettings(ctx.user.id);
        const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxAmount = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0);
        const discountAmount = (subtotal * (input.discountPercent || 0)) / 100;
        const totalAmount = subtotal + taxAmount - discountAmount;
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber: input.invoiceNumber || "PREVIEW",
          issueDate: new Date(),
          dueDate: input.dueDate,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerAddress: input.customerAddress,
          companyName: userSettings?.companyName || "Công Ty",
          companyAddress: userSettings?.companyAddress || "",
          companyPhone: userSettings?.companyPhone || "",
          companyEmail: userSettings?.companyEmail || "",
          companyTaxId: userSettings?.taxId || "",
          items: input.items.map(item => ({
            name: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: (item.quantity * item.unitPrice * item.taxRate) / 100,
            totalAmount: item.quantity * item.unitPrice,
          })),
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          currency: input.currency,
          notes: input.notes,
        });
        return {
          success: true,
          buffer: pdfBuffer.toString("base64"),
          filename: `${input.invoiceNumber || "preview"}.pdf`,
        };
      }),
    // Customer self-export invoice PDF
    exportMyInvoice: publicProcedure
      .input(z.object({ invoiceId: z.number(), token: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customerSessions, invoices, invoiceItems, customers, users, userSettings: userSettingsTable } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
        const [invoice] = await drizzleDb.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hóa đơn" });
        // Verify invoice belongs to this customer
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer || invoice.customerId !== customer.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền xuất hóa đơn này" });
        }
        const invoiceItemsData = await drizzleDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, input.invoiceId));
        const [owner] = await drizzleDb.select().from(users).limit(1);
        const [settings] = owner ? await drizzleDb.select().from(userSettingsTable).where(eq(userSettingsTable.userId, owner.id)).limit(1) : [[]];
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.createdAt,
          dueDate: invoice.expiresAt || undefined,
          customerName: customer.name || "Khách Hàng",
          customerEmail: customer.email || "",
          customerAddress: customer.address || "",
          companyName: (settings as any)?.companyName || "Công Ty",
          companyAddress: (settings as any)?.companyAddress || "",
          companyPhone: (settings as any)?.companyPhone || "",
          companyEmail: (settings as any)?.companyEmail || "",
          companyTaxId: (settings as any)?.taxId || "",
          items: invoiceItemsData.map(item => ({
            name: item.name,
            quantity: typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity,
            unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
            taxAmount: typeof item.taxAmount === "string" ? parseFloat(item.taxAmount || "0") : (item.taxAmount || 0),
            totalAmount: typeof item.totalAmount === "string" ? parseFloat(item.totalAmount) : item.totalAmount,
          })),
          subtotal: typeof invoice.subtotal === "string" ? parseFloat(invoice.subtotal) : invoice.subtotal,
          taxAmount: typeof invoice.taxAmount === "string" ? parseFloat(invoice.taxAmount) : (invoice.taxAmount || 0),
          discountAmount: typeof invoice.discountAmount === "string" ? parseFloat(invoice.discountAmount) : (invoice.discountAmount || 0),
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          notes: invoice.notes || undefined,
          paymentUrl: invoice.paymentUrl || undefined,
        });
        return { success: true, buffer: pdfBuffer.toString("base64"), filename: `${invoice.invoiceNumber}.pdf` };
      }),
  }),
  // Email Notificationss
  email: router({
    sendInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number(), recipientEmail: z.string().email(), origin: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
        const userSettings = await db.getUserSettings(ctx.user.id);
        // Use custom payment page instead of PayOS checkout URL directly
        const paymentPageUrl = input.origin ? `${input.origin}/pay/${invoice.id}` : (invoice.paymentUrl || undefined);
        const html = generateInvoiceEmailHTML({
          invoiceNumber: invoice.invoiceNumber,
          customerName: customer?.name || "Khách Hàng",
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          companyName: userSettings?.companyName || "Công Ty",
          paymentUrl: paymentPageUrl,
        });
        
         const success = await sendEmail({
           to: input.recipientEmail,
           subject: `Hóa Đơn ${invoice.invoiceNumber}`,
           html,
           userId: ctx.user.id,
         });
         
         return { success };
       }),

    sendPaymentConfirmation: protectedProcedure
      .input(z.object({ invoiceId: z.number(), recipientEmail: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        const userSettings = await db.getUserSettings(ctx.user.id);
        const html = generatePaymentConfirmationEmailHTML({
          invoiceNumber: invoice.invoiceNumber,
          customerName: "Khách Hàng",
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          paidAt: invoice.paidAt || new Date(),
          companyName: userSettings?.companyName || "Công Ty",
        });
        
        const success = await sendEmail({
          to: input.recipientEmail,
          subject: `Xác Nhận Thanh Toán - ${invoice.invoiceNumber}`,
          html,
          userId: ctx.user.id,
        });
        
        return { success };
      }),
   }),
  // Excel Export
  excel: router({
    exportReport: protectedProcedure
      .input(z.object({
        period: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoices = await db.getInvoicesByUserId(ctx.user.id);
        
        // Fetch customer names
        const invoicesWithCustomers = await Promise.all(
          invoices.map(async (inv) => {
            let customerName = "Khách Hàng";
            if (inv.customerId) {
              const customer = await db.getCustomerById(inv.customerId);
              customerName = customer?.name || "Khách Hàng";
            }
            return { ...inv, customerName, status: inv.status || "CREATED", currency: inv.currency || "VND" };
          })
        );
        
        const paidInvoices = invoices.filter(inv => inv.status === "PAID");
        const totalRevenue = paidInvoices.reduce((sum, inv) => {
          const amount = typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : inv.totalAmount;
          return sum + amount;
        }, 0);
        
        const excelBuffer = generateInvoiceExcel({
          invoices: invoicesWithCustomers,
          period: input.period || new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" }),
          totalRevenue,
          totalInvoices: invoices.length,
          paidInvoices: paidInvoices.length,
          pendingInvoices: invoices.filter(inv => inv.status === "CREATED").length,
        });
        
        return {
          success: true,
          buffer: excelBuffer.toString("base64"),
          filename: `bao-cao-hoa-don-${Date.now()}.xlsx`,
        };
      }),
  }),
  // Reviews
  reviews: router({
    // Public: submit a review via token
    submit: publicProcedure
      .input(z.object({
        token: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        customerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const invoice = await (async () => {
          const { getDb } = await import("./db");
          const drizzleDb = await getDb();
          if (!drizzleDb) return null;
          const { invoices } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const result = await drizzleDb.select().from(invoices).where(eq(invoices.reviewToken, input.token)).limit(1);
          return result.length > 0 ? result[0] : null;
        })();
        if (!invoice) throw new Error("Link đánh giá không hợp lệ hoặc đã hết hạn");
        if (invoice.reviewSubmitted) throw new Error("Đơn hàng này đã được đánh giá");
        
        const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
        
        await db.createReview({
          invoiceId: invoice.id,
          customerId: invoice.customerId || 0,
          token: input.token,
          rating: input.rating,
          comment: input.comment || null,
          customerName: input.customerName || customer?.name || "Khách Hàng",
          productName: null,
          isPublic: true,
          isApproved: false, // Requires admin approval
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Mark invoice as reviewed
        await db.updateInvoice(invoice.id, { reviewSubmitted: true, updatedAt: new Date() });
        
        return { success: true };
      }),

    // Public: get approved reviews
    getPublic: publicProcedure.query(async () => {
      return db.getPublicReviews();
    }),

    // Protected: admin get all reviews
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getAllReviews();
    }),

    // Protected: approve/reject review
    updateApproval: protectedProcedure
      .input(z.object({
        id: z.number(),
        isApproved: z.boolean(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.updateReview(input.id, {
          isApproved: input.isApproved,
          isPublic: input.isPublic ?? true,
          updatedAt: new Date(),
        });
        return { success: true };
      }),

    // Protected: delete review
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.deleteReview(input.id);
        return { success: true };
      }),

    // Public: get review info by token (to show form)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const review = await db.getReviewByToken(input.token);
        // Find invoice by token
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { invoices } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const result = await drizzleDb.select().from(invoices).where(eq(invoices.reviewToken, input.token)).limit(1);
        const invoice = result.length > 0 ? result[0] : null;
        if (!invoice) return null;
        return {
          invoiceNumber: invoice.invoiceNumber,
          reviewSubmitted: invoice.reviewSubmitted,
          existingReview: review || null,
        };
      }),
  }),

  // SMTP Configuration
  smtp: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const config = await db.getSmtpConfig(ctx.user.id);
      if (!config) return null;
      // Return hasPassword flag instead of actual password for security
      return {
        id: config.id,
        host: config.host,
        port: config.port,
        user: config.user,
        hasPassword: !!(config.password && config.password.length > 0),
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        secure: config.secure,
        enabled: config.enabled,
      };
    }),

    update: protectedProcedure
      .input(z.object({
        host: z.string().optional(),
        port: z.number().optional(),
        user: z.string().optional(),
        password: z.string().optional(),
        fromName: z.string().optional(),
        fromEmail: z.string().optional(),
        secure: z.boolean().optional(),
        enabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertSmtpConfig(ctx.user.id, input);
        return { success: true };
      }),

    test: protectedProcedure
      .input(z.object({ testEmail: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { sendEmail } = await import("./email");
        const smtpTestSettings = await db.getUserSettings(ctx.user.id);
        const smtpTestAppName = smtpTestSettings?.companyName || "";
        const success = await sendEmail({
          to: input.testEmail,
          subject: `Test Email${smtpTestAppName ? ` - ${smtpTestAppName}` : ""}`,
          html: "<p>Email SMTP đang hoạt động bình thường!</p>",
          userId: ctx.user.id,
        });
        return { success };
      }),
  }),

  emailTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getEmailTemplatesByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ type: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "REVIEW"]) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = await db.getEmailTemplateByType(ctx.user.id, input.type);
        return template ?? null;
      }),
    upsert: protectedProcedure
      .input(z.object({
        type: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "REVIEW"]),
        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { type, ...data } = input;
        await db.upsertEmailTemplate(ctx.user.id, type, data);
        return { success: true };
      }),
  }),

  // ─── Invoice Notes ─────────────────────────────────────────────────────────
  notes: router({
    list: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return db.getInvoiceNotes(input.invoiceId);
      }),
    create: protectedProcedure
      .input(z.object({ invoiceId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createInvoiceNote(input.invoiceId, ctx.user.id, input.content);
        await db.createActivityLog(ctx.user.id, "ADD_NOTE", "invoice", input.invoiceId);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.deleteInvoiceNote(input.id);
        return { success: true };
      }),
  }),

  // ─── Staff Management ────────────────────────────────────────────────────────
  staff: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
      return db.getAllStaff();
    }),
    create: protectedProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        name: z.string().min(1),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(input.password, 10);
        const email = `${input.username}@staff.local`;
        await db.createStaff(email, hashed, input.name, input.role);
        await db.createActivityLog(ctx.user.id, "CREATE_STAFF", "user");
        return { success: true };
      }),
    updateRole: protectedProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
        await db.updateStaffRole(input.id, input.role);
        return { success: true };
      }),
    resetPassword: protectedProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(input.newPassword, 10);
        await db.updateStaffPassword(input.id, hashed);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
        if (input.id === ctx.user.id) throw new Error("Cannot delete yourself");
        await db.deleteStaff(input.id);
        return { success: true };
      }),
  }),

  // ─── Activity Logs ───────────────────────────────────────────────────────────
  activityLogs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
        return db.getActivityLogs(input.limit ?? 100);
      }),
  }),

  // ─── Statistics ──────────────────────────────────────────────────────────────
  stats: router({
    revenue: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getRevenueStats(ctx.user.id);
    }),
    topProducts: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getTopProducts(ctx.user.id);
    }),
    customerStats: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return db.getCustomerStats(ctx.user.id, input.customerId);
      }),
  }),

  // ─── Reminders ───────────────────────────────────────────────────────────────
  reminders: router({
    sendPending: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
      const pending = await db.getPendingInvoicesForReminder();
      const { sendEmail } = await import("./email");
      let sent = 0;
      for (const inv of pending) {
        if (!inv.customerEmail) continue;
        const hoursOld = (Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60);
        const type: "24h" | "48h" = hoursOld >= 48 ? "48h" : "24h";
        const alreadySent = await db.hasReminderBeenSent(inv.id, type);
        if (alreadySent) continue;
        const success = await sendEmail({
          to: inv.customerEmail,
          subject: `Nhắc nhở: Đơn hàng ${inv.invoiceNumber} chưa được thanh toán`,
          html: `<p>Xin chào ${inv.customerName || "Quý khách"},</p><p>Đơn hàng <strong>${inv.invoiceNumber}</strong> của bạn (tổng tiền: ${Number(inv.totalAmount).toLocaleString("vi-VN")} VND) vẫn chưa được thanh toán.</p><p>Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng cho bạn.</p>`,
          userId: ctx.user.id,
        });
        await db.createReminderLog(inv.id, type, success);
        if (success) sent++;
      }
      return { sent, total: pending.length };
    }),
    getLogs: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
      return db.getReminderLogs();
    }),
    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") throw new Error("Forbidden");
      const pending = await db.getPendingInvoicesForReminder();
      return pending;
    }),
    // Send bulk reminder emails for specific invoice IDs (for expiring soon widget)
    sendBulkReminder: protectedProcedure
      .input(z.object({
        invoiceIds: z.array(z.number()),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { sendEmail } = await import("./email");
        let sent = 0;
        for (const invoiceId of input.invoiceIds) {
          const inv = await db.getInvoiceById(invoiceId);
          if (!inv || inv.userId !== ctx.user.id) continue;
          const customer = inv.customerId ? await db.getCustomerById(inv.customerId) : null;
          if (!customer?.email) continue;
          const origin = input.origin || "";
          const paymentUrl = inv.paymentUrl || (origin ? `${origin}/pay/${inv.id}` : "");
          const success = await sendEmail({
            to: customer.email,
            subject: `Nhắc nhở: Đơn hàng ${inv.invoiceNumber} sắp hết hạn`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#ea580c">⚠️ Đơn Hàng Sắp Hết Hạn</h2><p>Xin chào <strong>${customer.name || "Quý khách"}</strong>,</p><p>Đơn hàng <strong>${inv.invoiceNumber}</strong> của bạn sắp hết hạn. Tổng tiền: <strong>${Number(inv.totalAmount).toLocaleString("vi-VN")} ${inv.currency || "VND"}</strong>.</p>${paymentUrl ? `<p><a href="${paymentUrl}" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Thanh Toán Ngay</a></p>` : ""}<p style="color:#6b7280;font-size:12px">Email này được gửi tự động bởi hệ thống quản lý hóa đơn.</p></div>`,
            userId: ctx.user.id,
          });
          if (success) sent++;
        }
        return { sent, total: input.invoiceIds.length };
      }),
  }),
  invoiceTemplates2: router({
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        companyName: z.string().optional(),
        companyAddress: z.string().optional(),
        companyPhone: z.string().optional(),
        companyEmail: z.string().optional(),
        companyTaxCode: z.string().optional(),
        logo: z.string().optional(),
        invoiceTitle: z.string().optional(),
        footer: z.string().optional(),
        headerColor: z.string().optional(),
        accentColor: z.string().optional(),
        textColor: z.string().optional(),
        bgColor: z.string().optional(),
        fontFamily: z.string().optional(),
        showLogo: z.boolean().optional(),
        showTaxCode: z.boolean().optional(),
        showBankInfo: z.boolean().optional(),
        bankInfo: z.string().optional(),
        notes: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const template = await db.getInvoiceTemplateById(input.id);
        if (!template || template.userId !== ctx.user.id) throw new Error("Not found");
        const { id, ...updateData } = input;
        // If setting as default, unset all other templates first
        if (updateData.isDefault) {
          await db.unsetAllDefaultTemplates(ctx.user.id);
        }
        await db.updateInvoiceTemplate(id, { ...updateData, updatedAt: new Date() });
        return { success: true };
      }),
  }),

  // ─── Email Campaigns ────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getEmailCampaignsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        targetType: z.enum(["ALL", "PAID", "UNPAID", "CUSTOM"]).default("ALL"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const id = await db.createEmailCampaign({
          userId: ctx.user.id,
          name: input.name,
          subject: input.subject,
          htmlBody: input.htmlBody,
          targetType: input.targetType,
          status: "DRAFT",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        htmlBody: z.string().optional(),
        targetType: z.enum(["ALL", "PAID", "UNPAID", "CUSTOM"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const campaign = await db.getEmailCampaignById(input.id);
        if (!campaign || campaign.userId !== ctx.user.id) throw new Error("Not found");
        if (campaign.status === "SENDING") throw new Error("Không thể sửa chiến dịch đang gửi");
        const { id, ...updateData } = input;
        await db.updateEmailCampaign(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const campaign = await db.getEmailCampaignById(input.id);
        if (!campaign || campaign.userId !== ctx.user.id) throw new Error("Not found");
        if (campaign.status === "SENDING") throw new Error("Không thể xóa chiến dịch đang gửi");
        await db.deleteEmailCampaign(input.id);
        return { success: true };
      }),

    send: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const campaign = await db.getEmailCampaignById(input.id);
        if (!campaign || campaign.userId !== ctx.user.id) throw new Error("Not found");
        if (campaign.status === "SENDING") throw new Error("Chiến dịch đang được gửi");
        if (campaign.status === "SENT") throw new Error("Chiến dịch đã được gửi");

        // Get target customers
        const allCustomers = await db.getCustomersByUserId(ctx.user.id);
        let targetCustomers = allCustomers.filter(c => c.email);

        if (campaign.targetType === "PAID") {
          // Customers who have at least one paid invoice
          const paidInvoices = await db.getInvoicesByUserId(ctx.user.id);
          const paidCustomerIds = new Set(paidInvoices.filter(i => i.status === "PAID" || i.status === "SHIPPING" || i.status === "WARRANTY").map(i => i.customerId).filter((id): id is number => id !== null));
          targetCustomers = targetCustomers.filter(c => paidCustomerIds.has(c.id));
        } else if (campaign.targetType === "UNPAID") {
          const allInvoices = await db.getInvoicesByUserId(ctx.user.id);
          const unpaidCustomerIds = new Set(allInvoices.filter(i => i.status === "CREATED" || i.status === "EXPIRED").map(i => i.customerId).filter((id): id is number => id !== null));
          targetCustomers = targetCustomers.filter(c => unpaidCustomerIds.has(c.id));
        }

        if (targetCustomers.length === 0) {
          throw new Error("Không có khách hàng nào phù hợp để gửi email");
        }

        // Mark as SENDING
        await db.updateEmailCampaign(input.id, { status: "SENDING", totalRecipients: targetCustomers.length });

        // Create recipient records
        await db.createEmailCampaignRecipients(targetCustomers.map(c => ({
          campaignId: input.id,
          customerId: c.id,
          email: c.email!,
          name: c.name,
          status: "PENDING" as const,
        })));

        // Send emails
        let sentCount = 0;
        let failedCount = 0;
        const recipients = await db.getEmailCampaignRecipients(input.id);

        for (const recipient of recipients) {
          try {
            // Personalize HTML
            const personalizedHtml = campaign.htmlBody
              .replace(/\{\{name\}\}/g, recipient.name || "Quý khách")
              .replace(/\{\{email\}\}/g, recipient.email);

            const sent = await sendEmail({
              userId: ctx.user.id,
              to: recipient.email,
              subject: campaign.subject,
              html: personalizedHtml,
            });

            if (sent) {
              sentCount++;
              await db.updateEmailCampaignRecipient(recipient.id, { status: "SENT", sentAt: new Date() });
            } else {
              failedCount++;
              await db.updateEmailCampaignRecipient(recipient.id, { status: "FAILED", errorMessage: "SMTP not configured" });
            }
          } catch (err: any) {
            failedCount++;
            await db.updateEmailCampaignRecipient(recipient.id, { status: "FAILED", errorMessage: err.message });
          }
        }

        await db.updateEmailCampaign(input.id, {
          status: failedCount === recipients.length ? "FAILED" : "SENT",
          sentCount,
          failedCount,
          sentAt: new Date(),
        });

        return { sentCount, failedCount, total: recipients.length };
      }),

    getRecipients: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const campaign = await db.getEmailCampaignById(input.id);
        if (!campaign || campaign.userId !== ctx.user.id) throw new Error("Not found");
        return db.getEmailCampaignRecipients(input.id);
      }),

    previewRecipients: protectedProcedure
      .input(z.object({ targetType: z.enum(["ALL", "PAID", "UNPAID", "CUSTOM"]) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const allCustomers = await db.getCustomersByUserId(ctx.user.id);
        let targetCustomers = allCustomers.filter(c => c.email);

        if (input.targetType === "PAID") {
          const paidInvoices = await db.getInvoicesByUserId(ctx.user.id);
          const paidCustomerIds = new Set(paidInvoices.filter(i => i.status && ["PAID","SHIPPING","WARRANTY"].includes(i.status)).map(i => i.customerId).filter((id): id is number => id !== null));
          targetCustomers = targetCustomers.filter(c => paidCustomerIds.has(c.id));
        } else if (input.targetType === "UNPAID") {
          const allInvoices = await db.getInvoicesByUserId(ctx.user.id);
          const unpaidCustomerIds = new Set(allInvoices.filter(i => i.status && ["CREATED","EXPIRED"].includes(i.status)).map(i => i.customerId).filter((id): id is number => id !== null));
          targetCustomers = targetCustomers.filter(c => unpaidCustomerIds.has(c.id));
        }

        return { count: targetCustomers.length, samples: targetCustomers.slice(0, 5).map(c => ({ name: c.name, email: c.email ?? "" })) };
      }),
  }),
  // ─── Settings Extended ──────────────────────────────────────────────────────
  settingsExt: router({
    updateTelegram: protectedProcedure
      .input(z.object({
        telegramBotToken: z.string().optional(),
        telegramChatId: z.string().optional(),
        telegramEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    testTelegram: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const settings = await db.getUserSettings(ctx.user.id);
      if (!settings?.telegramBotToken || !settings?.telegramChatId) {
        throw new Error("Telegram chưa được cấu hình");
      }
      const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: settings.telegramChatId, text: `✅ ${settings.companyName || "Hệ thống"}: Kết nối Telegram thành công!` }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (!data.ok) throw new Error(data.description || "Gửi thất bại");
      return { success: true };
    }),
    updateThankYou: protectedProcedure
      .input(z.object({
        thankYouTitle: z.string().optional(),
        thankYouMessage: z.string().optional(),
        thankYouSocialLinks: z.array(z.object({ platform: z.string(), url: z.string() })).optional(),
        thankYouBgFrom: z.string().optional(),
        thankYouBgTo: z.string().optional(),
        thankYouBannerUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    getThankYouPublic: publicProcedure
      .query(async () => {
        // Lấy settings của owner (user đầu tiên trong hệ thống)
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        const { userSettings } = await import("../drizzle/schema");
        let settings = null;
        if (drizzleDb) {
          const rows = await drizzleDb.select().from(userSettings).limit(1);
          settings = rows[0] ?? null;
        }
        return {
          thankYouTitle: settings?.thankYouTitle || "Cảm Ơn Bạn Đã Thanh Toán!",
          thankYouMessage: settings?.thankYouMessage || "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.",
          thankYouSocialLinks: (settings?.thankYouSocialLinks as Array<{platform: string; url: string}> | null) || [],
          companyName: settings?.companyName || "",
          logoUrl: settings?.logoUrl || null,
          thankYouBgFrom: settings?.thankYouBgFrom || "#f0fdf4",
          thankYouBgTo: settings?.thankYouBgTo || "#eff6ff",
          thankYouBannerUrl: settings?.thankYouBannerUrl || null,
        };
      }),
    exportBackup: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const [invoices, customers, products, settings] = await Promise.all([
        db.getInvoicesByUserId(ctx.user.id),
        db.getCustomersByUserId(ctx.user.id),
        db.getProductsByUserId(ctx.user.id),
        db.getUserSettings(ctx.user.id),
      ]);
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const invoiceRows = invoices.map(i => ({
        "Mã HĐ": i.invoiceNumber,
        "Ngày Tạo": new Date(i.createdAt).toLocaleDateString("vi-VN"),
        "Trạng Thái": i.status,
        "Tiền Tệ": i.currency,
        "Tổng Tiền": Number(i.totalAmount),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), "Hóa Đơn");
      const customerRows = customers.map(c => ({
        "Tên": c.name,
        "Email": c.email || "",
        "SĐT": c.phone || "",
        "Địa Chỉ": c.address || "",
        "Mã Số Thuế": c.taxCode || "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customerRows), "Khách Hàng");
      const productRows = products.map(p => ({
        "Tên Sản Phẩm": p.name,
        "Mô Tả": p.description || "",
        "Danh Mục": p.category || "",
        "Đơn Giá": Number(p.price),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productRows), "Sản Phẩm");
      const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      return { base64: buf, filename: `backup-${new Date().toISOString().slice(0,10)}.xlsx` };
    }),
    getWeeklyReportSettings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const s = await db.getUserSettings(ctx.user.id);
      return {
        weeklyReport: s?.weeklyReport ?? false,
        weeklyReportEmail: s?.weeklyReportEmail || "",
      };
    }),
    updateWeeklyReport: protectedProcedure
      .input(z.object({ weeklyReport: z.boolean(), weeklyReportEmail: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ========== WARRANTY ==========
  warranty: router({
    // Get warranty settings
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const { warrantySettings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(warrantySettings).where(eq(warrantySettings.userId, ctx.user.id)).limit(1);
      return rows[0] || null;
    }),
    // Update warranty settings
    updateSettings: protectedProcedure
      .input(z.object({
        defaultMonths: z.number().min(0).max(120),
        termsAndConditions: z.string().optional(),
        contactInfo: z.string().optional(),
        autoActivateOnPaid: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { warrantySettings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(warrantySettings).where(eq(warrantySettings.userId, ctx.user.id)).limit(1);
        if (existing[0]) {
          await drizzleDb.update(warrantySettings).set(input).where(eq(warrantySettings.userId, ctx.user.id));
        } else {
          await drizzleDb.insert(warrantySettings).values({ userId: ctx.user.id, ...input });
        }
        return { success: true };
      }),
    // List all warranty claims
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { warranties } = await import("../drizzle/schema");
        const { eq, desc, and } = await import("drizzle-orm");
        let conditions = [eq(warranties.userId, ctx.user.id)];
        if (input?.status) {
          conditions.push(eq(warranties.status, input.status as any));
        }
        return drizzleDb.select().from(warranties).where(and(...conditions)).orderBy(desc(warranties.createdAt));
      }),
    // Create warranty claim from invoice
    create: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { warranties, invoices: invoicesTable, invoiceItems, customers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Get invoice
        const inv = await drizzleDb.select().from(invoicesTable).where(eq(invoicesTable.id, input.invoiceId)).limit(1);
        if (!inv[0]) throw new Error("Invoice not found");
        const invoice = inv[0];
        // Get customer
        const cust = await drizzleDb.select().from(customers).where(eq(customers.id, invoice.customerId)).limit(1);
        // Get items
        const items = await drizzleDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
        const productNames = items.map(i => i.name).join(", ");
        await drizzleDb.insert(warranties).values({
          userId: ctx.user.id,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: cust[0]?.name || "",
          customerEmail: cust[0]?.email || "",
          customerPhone: cust[0]?.phone || "",
          productNames,
          reason: input.reason || "",
          warrantyStartDate: invoice.warrantyStartDate,
          warrantyExpiryDate: invoice.warrantyExpiryDate,
        });
        return { success: true };
      }),
    // Update warranty status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
        resolution: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { warranties } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.update(warranties).set({ status: input.status, resolution: input.resolution }).where(and(eq(warranties.id, input.id), eq(warranties.userId, ctx.user.id)));
        return { success: true };
      }),
    // Delete warranty
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { warranties } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.delete(warranties).where(and(eq(warranties.id, input.id), eq(warranties.userId, ctx.user.id)));
        return { success: true };
      }),
    // Get public warranty settings (for WarrantyLookup page)
    getPublicSettings: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const { warrantySettings } = await import("../drizzle/schema");
      const rows = await drizzleDb.select({ termsAndConditions: warrantySettings.termsAndConditions, contactInfo: warrantySettings.contactInfo }).from(warrantySettings).limit(1);
      return rows[0] || null;
    }),
  }),

  // ========== FLASH SALE ==========
  flashSale: router({
    // List all (admin)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { flashSales } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb.select().from(flashSales).where(eq(flashSales.userId, ctx.user.id)).orderBy(desc(flashSales.createdAt));
    }),
    // Create
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        productName: z.string(),
        originalPrice: z.string(),
        salePrice: z.string(),
        discountPercent: z.number(),
        startTime: z.string(),
        endTime: z.string(),
        maxQuantity: z.number().default(0),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { flashSales } = await import("../drizzle/schema");
        await drizzleDb.insert(flashSales).values({
          userId: ctx.user.id,
          productId: input.productId,
          productName: input.productName,
          originalPrice: input.originalPrice,
          salePrice: input.salePrice,
          discountPercent: input.discountPercent,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          maxQuantity: input.maxQuantity,
          description: input.description,
        });
        return { success: true };
      }),
    // Update
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        salePrice: z.string().optional(),
        discountPercent: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        maxQuantity: z.number().optional(),
        isActive: z.boolean().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { flashSales } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);
        await drizzleDb.update(flashSales).set(updateData).where(and(eq(flashSales.id, id), eq(flashSales.userId, ctx.user.id)));
        return { success: true };
      }),
    // Delete
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB error");
        const { flashSales } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.delete(flashSales).where(and(eq(flashSales.id, input.id), eq(flashSales.userId, ctx.user.id)));
        return { success: true };
      }),
    // Public: get active flash sales
    getActive: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { flashSales } = await import("../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      const now = new Date();
      return drizzleDb.select().from(flashSales)
        .where(and(eq(flashSales.isActive, true), lte(flashSales.startTime, now), gte(flashSales.endTime, now)))
        .orderBy(flashSales.endTime);
    }),
  }),

  // ========== QUEUE (Public) ==========
  queue: router({
    getOrders: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { invoices: invoicesTable, customers } = await import("../drizzle/schema");
        const { eq, asc, inArray } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({
            id: invoicesTable.id,
            invoiceNumber: invoicesTable.invoiceNumber,
            status: invoicesTable.status,
            totalAmount: invoicesTable.totalAmount,
            currency: invoicesTable.currency,
            createdAt: invoicesTable.createdAt,
            customerName: customers.name,
          })
          .from(invoicesTable)
          .leftJoin(customers, eq(invoicesTable.customerId, customers.id))
          .where(inArray(invoicesTable.status, ["CREATED", "PAID", "SHIPPING"]))
          .orderBy(asc(invoicesTable.createdAt))
          .limit(input?.limit || 50);
        return rows;
      }),
  }),

  // ========== LEADERBOARD (Public) ==========
  leaderboard: router({
    getTop: publicProcedure
      .input(z.object({ period: z.enum(["day", "week", "month", "year"]) }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { invoices: invoicesTable, customers } = await import("../drizzle/schema");
        const { eq, gte, sql, and, inArray } = await import("drizzle-orm");
        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (input.period) {
          case "day": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
          case "week": { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); startDate = d; break; }
          case "month": startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
          case "year": startDate = new Date(now.getFullYear(), 0, 1); break;
        }
        const rows = await drizzleDb
          .select({
            customerName: customers.name,
            customerEmail: customers.email,
            totalSpent: sql<string>`SUM(CAST(${invoicesTable.totalAmount} AS DECIMAL(15,2)))`.as("totalSpent"),
            orderCount: sql<number>`COUNT(${invoicesTable.id})`.as("orderCount"),
          })
          .from(invoicesTable)
          .leftJoin(customers, eq(invoicesTable.customerId, customers.id))
          .where(and(
            inArray(invoicesTable.status, ["PAID", "SHIPPING", "WARRANTY"]),
            gte(invoicesTable.createdAt, startDate)
          ))
          .groupBy(customers.id, customers.name, customers.email)
          .orderBy(sql`totalSpent DESC`)
          .limit(20);
        return rows.map((r, i) => ({
          rank: i + 1,
          name: r.customerName || "Ẩn danh",
          email: r.customerEmail ? r.customerEmail.replace(/(.)(.*)(@.*)/, "$1***$3") : "",
          totalSpent: r.totalSpent || "0",
          orderCount: r.orderCount || 0,
        }));
      }),
  }),

  // ===== COUPON =====
  coupon: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { coupons } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(coupons).orderBy(desc(coupons.createdAt));
    }),
    create: protectedProcedure.input(z.object({
      code: z.string().min(1).max(50),
      description: z.string().optional(),
      discountType: z.enum(["percent", "fixed"]),
      discountValue: z.number().min(0),
      minOrderAmount: z.number().min(0).optional(),
      maxDiscountAmount: z.number().min(0).optional(),
      maxUses: z.number().min(0).optional(),
      maxUsesPerCustomer: z.number().min(0).optional(),
      startsAt: z.string().optional(),
      expiresAt: z.string().optional(),
      isActive: z.boolean().optional(),
      productId: z.number().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { coupons } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database not available");
      await drizzleDb.insert(coupons).values({
        code: input.code.toUpperCase(),
        description: input.description || null,
        discountType: input.discountType,
        discountValue: String(input.discountValue),
        minOrderAmount: String(input.minOrderAmount || 0),
        maxDiscountAmount: input.maxDiscountAmount ? String(input.maxDiscountAmount) : null,
        maxUses: input.maxUses || 0,
        maxUsesPerCustomer: input.maxUsesPerCustomer || 1,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: input.isActive ?? true,
        productId: input.productId ?? null,
      });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      code: z.string().min(1).max(50).optional(),
      description: z.string().optional(),
      discountType: z.enum(["percent", "fixed"]).optional(),
      discountValue: z.number().min(0).optional(),
      minOrderAmount: z.number().min(0).optional(),
      maxDiscountAmount: z.number().min(0).optional(),
      maxUses: z.number().min(0).optional(),
      maxUsesPerCustomer: z.number().min(0).optional(),
      startsAt: z.string().optional(),
      expiresAt: z.string().optional(),
      isActive: z.boolean().optional(),
      productId: z.number().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { coupons } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database not available");
      const updates: any = {};
      if (input.code !== undefined) updates.code = input.code.toUpperCase();
      if (input.description !== undefined) updates.description = input.description;
      if (input.discountType !== undefined) updates.discountType = input.discountType;
      if (input.discountValue !== undefined) updates.discountValue = String(input.discountValue);
      if (input.minOrderAmount !== undefined) updates.minOrderAmount = String(input.minOrderAmount);
      if (input.maxDiscountAmount !== undefined) updates.maxDiscountAmount = input.maxDiscountAmount ? String(input.maxDiscountAmount) : null;
      if (input.maxUses !== undefined) updates.maxUses = input.maxUses;
      if (input.maxUsesPerCustomer !== undefined) updates.maxUsesPerCustomer = input.maxUsesPerCustomer;
      if (input.startsAt !== undefined) updates.startsAt = input.startsAt ? new Date(input.startsAt) : null;
      if (input.expiresAt !== undefined) updates.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      if (input.productId !== undefined) updates.productId = input.productId;
      await drizzleDb.update(coupons).set(updates).where(eq(coupons.id, input.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { coupons } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("Database not available");
      await drizzleDb.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),
    // Stats: thống kê hiệu quả coupon
    stats: protectedProcedure.query(async ({ ctx }) => {
      const { coupons, couponUsages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, sql, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { overview: { totalCoupons: 0, activeCoupons: 0, totalUsages: 0, totalDiscountGiven: 0 }, perCoupon: [] };
      // Overview stats
      const allCoupons = await drizzleDb.select().from(coupons).orderBy(desc(coupons.createdAt));
      const activeCoupons = allCoupons.filter(c => c.isActive && (!c.expiresAt || c.expiresAt > new Date()));
      const [usageStats] = await drizzleDb.select({
        totalUsages: sql<number>`count(*)`,
        totalDiscountGiven: sql<number>`COALESCE(SUM(CAST(${couponUsages.discountAmount} AS DECIMAL(15,2))), 0)`,
      }).from(couponUsages);
      // Per-coupon stats
      const perCouponRaw = await drizzleDb.select({
        couponId: couponUsages.couponId,
        usageCount: sql<number>`count(*)`,
        totalDiscount: sql<number>`COALESCE(SUM(CAST(${couponUsages.discountAmount} AS DECIMAL(15,2))), 0)`,
        lastUsedAt: sql<string>`MAX(${couponUsages.usedAt})`,
      }).from(couponUsages).groupBy(couponUsages.couponId);
      const perCouponMap = new Map(perCouponRaw.map(r => [r.couponId, r]));
      const perCoupon = allCoupons.map(c => {
        const stats = perCouponMap.get(c.id);
        const usageCount = stats?.usageCount || 0;
        const totalDiscount = Number(stats?.totalDiscount || 0);
        const conversionRate = c.maxUses && c.maxUses > 0 ? Math.round((usageCount / c.maxUses) * 100) : null;
        return {
          id: c.id,
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          isActive: c.isActive,
          expiresAt: c.expiresAt,
          maxUses: c.maxUses,
          usedCount: c.usedCount || 0,
          usageCount,
          totalDiscount,
          conversionRate,
          lastUsedAt: stats?.lastUsedAt || null,
        };
      });
      return {
        overview: {
          totalCoupons: allCoupons.length,
          activeCoupons: activeCoupons.length,
          totalUsages: Number(usageStats?.totalUsages || 0),
          totalDiscountGiven: Number(usageStats?.totalDiscountGiven || 0),
        },
        perCoupon,
      };
    }),
    // Public: list active coupons for coupon store page
    listPublic: publicProcedure.query(async () => {
      const { coupons } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { and, eq, or, isNull, gte } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const now = new Date();
      const allCoupons = await drizzleDb.select().from(coupons).where(eq(coupons.isActive, true));
      return allCoupons
        .filter(c => {
          if (c.startsAt && now < c.startsAt) return false;
          if (c.expiresAt && now > c.expiresAt) return false;
          if (c.maxUses && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) return false;
          return true;
        })
        .map(c => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          minOrderAmount: Number(c.minOrderAmount || 0),
          maxDiscountAmount: Number(c.maxDiscountAmount || 0),
          maxUses: c.maxUses,
          usedCount: c.usedCount || 0,
          expiresAt: c.expiresAt,
        }));
    }),
    // Public: validate coupon code
    validate: publicProcedure.input(z.object({
      code: z.string().min(1),
      orderAmount: z.number().min(0),
      customerEmail: z.string().optional(),
    })).query(async ({ input }) => {
      const { coupons, couponUsages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and, sql } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { valid: false, error: "Database not available" };
      const [coupon] = await drizzleDb.select().from(coupons).where(eq(coupons.code, input.code.toUpperCase())).limit(1);
      if (!coupon) return { valid: false, error: "M\u00e3 gi\u1ea3m gi\u00e1 kh\u00f4ng t\u1ed3n t\u1ea1i" };
      if (!coupon.isActive) return { valid: false, error: "M\u00e3 gi\u1ea3m gi\u00e1 \u0111\u00e3 ng\u1eebng ho\u1ea1t \u0111\u1ed9ng" };
      const now = new Date();
      if (coupon.startsAt && now < coupon.startsAt) return { valid: false, error: "M\u00e3 gi\u1ea3m gi\u00e1 ch\u01b0a b\u1eaft \u0111\u1ea7u" };
      if (coupon.expiresAt && now > coupon.expiresAt) return { valid: false, error: "M\u00e3 gi\u1ea3m gi\u00e1 \u0111\u00e3 h\u1ebft h\u1ea1n" };
      if (coupon.maxUses && coupon.maxUses > 0 && (coupon.usedCount || 0) >= coupon.maxUses) return { valid: false, error: "M\u00e3 gi\u1ea3m gi\u00e1 \u0111\u00e3 h\u1ebft l\u01b0\u1ee3t s\u1eed d\u1ee5ng" };
      const minOrder = Number(coupon.minOrderAmount || 0);
      if (input.orderAmount < minOrder) return { valid: false, error: `\u0110\u01a1n h\u00e0ng t\u1ed1i thi\u1ec3u ${minOrder.toLocaleString("vi-VN")}\u0111 \u0111\u1ec3 s\u1eed d\u1ee5ng m\u00e3 n\u00e0y` };
      // Check per-customer usage
      if (input.customerEmail && coupon.maxUsesPerCustomer && coupon.maxUsesPerCustomer > 0) {
        const usages = await drizzleDb.select({ count: sql<number>`count(*)` }).from(couponUsages)
          .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.customerEmail, input.customerEmail)));
        if ((usages[0]?.count || 0) >= coupon.maxUsesPerCustomer) return { valid: false, error: "B\u1ea1n \u0111\u00e3 s\u1eed d\u1ee5ng m\u00e3 n\u00e0y r\u1ed3i" };
      }
      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percent") {
        discountAmount = input.orderAmount * Number(coupon.discountValue) / 100;
        const maxDisc = Number(coupon.maxDiscountAmount || 0);
        if (maxDisc > 0 && discountAmount > maxDisc) discountAmount = maxDisc;
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      if (discountAmount > input.orderAmount) discountAmount = input.orderAmount;
      return {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount: Math.round(discountAmount),
        description: coupon.description,
      };
    }),
  }),

  // ─── Product Categories ───────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      const { productCategories, users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { asc, eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Only return categories belonging to the admin/owner user
      const [owner] = await drizzleDb.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
      if (!owner) return [];
      return drizzleDb.select().from(productCategories).where(eq(productCategories.userId, owner.id)).orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
    }),
    listProtected: protectedProcedure.query(async ({ ctx }) => {
      const { productCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(productCategories).where(eq(productCategories.userId, ctx.user.id)).orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      icon: z.string().optional(),
      parentId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { productCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(productCategories).values({ name: input.name, userId: ctx.user.id, icon: input.icon || null, parentId: input.parentId || null, sortOrder: input.sortOrder || 0 });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      icon: z.string().optional(),
      parentId: z.number().nullable().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { productCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { id, ...updates } = input;
      await drizzleDb.update(productCategories).set(updates as any).where(and(eq(productCategories.id, id), eq(productCategories.userId, ctx.user.id)));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const { productCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(productCategories).where(and(eq(productCategories.id, input.id), eq(productCategories.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── Loyalty Points ───────────────────────────────────────────────────────
  loyalty: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const { loyaltySettings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const [s] = await drizzleDb.select().from(loyaltySettings).where(eq(loyaltySettings.userId, ctx.user.id)).limit(1);
      return s || null;
    }),
    saveSettings: protectedProcedure.input(z.object({
      pointsPerAmount: z.number().min(1),
      redeemRate: z.number().min(1),
      isEnabled: z.boolean(),
    })).mutation(async ({ input, ctx }) => {
      const { loyaltySettings, featureFlags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const [existing] = await drizzleDb.select().from(loyaltySettings).where(eq(loyaltySettings.userId, ctx.user.id)).limit(1);
      if (existing) {
        await drizzleDb.update(loyaltySettings).set(input).where(eq(loyaltySettings.userId, ctx.user.id));
      } else {
        await drizzleDb.insert(loyaltySettings).values({ ...input, userId: ctx.user.id });
      }
      // Sync featureFlags
      const flagKey = "points";
      const existingFlag = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.key, flagKey)).limit(1);
      if (existingFlag.length > 0) {
        await drizzleDb.update(featureFlags).set({ enabled: input.isEnabled }).where(eq(featureFlags.key, flagKey));
      } else {
        await drizzleDb.insert(featureFlags).values({ key: flagKey, label: "Tích điểm", description: "", enabled: input.isEnabled, category: "feature" });
      }
      // Sync userSettings (so Settings page toggle stays in sync)
      const { userSettings } = await import("../drizzle/schema");
      const existingUS = await drizzleDb.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      if (existingUS.length > 0) {
        await drizzleDb.update(userSettings).set({ featureLoyalty: input.isEnabled }).where(eq(userSettings.userId, ctx.user.id));
      }
      return { success: true };
    }),
    listPoints: protectedProcedure.query(async ({ ctx }) => {
      const { loyaltyPoints } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc, sql } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Aggregate by customer email
      const rows = await drizzleDb.select({
        customerEmail: loyaltyPoints.customerEmail,
        customerName: loyaltyPoints.customerName,
        totalPoints: sql<number>`SUM(${loyaltyPoints.points})`,
        lastActivity: sql<string>`MAX(${loyaltyPoints.createdAt})`,
      }).from(loyaltyPoints).where(eq(loyaltyPoints.userId, ctx.user.id)).groupBy(loyaltyPoints.customerEmail, loyaltyPoints.customerName).orderBy(desc(sql`SUM(${loyaltyPoints.points})`));
      return rows;
    }),
    getByEmail: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { loyaltyPoints } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, sql, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { points: 0, history: [] };
      const [agg] = await drizzleDb.select({ total: sql<number>`SUM(${loyaltyPoints.points})` }).from(loyaltyPoints).where(eq(loyaltyPoints.customerEmail, input.email));
      const history = await drizzleDb.select().from(loyaltyPoints).where(eq(loyaltyPoints.customerEmail, input.email)).orderBy(desc(loyaltyPoints.createdAt)).limit(20);
      return { points: Number(agg?.total || 0), history };
    }),
    adjust: protectedProcedure.input(z.object({
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
      points: z.number(),
      reason: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const { loyaltyPoints } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(loyaltyPoints).values({ ...input, userId: ctx.user.id, customerName: input.customerName || null, invoiceId: null });
      return { success: true };
    }),
  }),

  // ─── Warranty Requests ────────────────────────────────────────────────────
  warrantyRequest: router({
    create: publicProcedure.input(z.object({
      invoiceCode: z.string().optional(),
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      description: z.string().min(10),
      imageUrls: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      const { warrantyRequests, warranties } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      // Find warranty by invoice code to get userId
      let userId = 1; // fallback
      if (input.invoiceCode) {
        const { invoices } = await import("../drizzle/schema");
        const [inv] = await drizzleDb.select().from(invoices).where(eq(invoices.invoiceNumber, input.invoiceCode)).limit(1);
        if (inv) userId = inv.userId;
      }
      await drizzleDb.insert(warrantyRequests).values({
        userId,
        invoiceCode: input.invoiceCode || null,
        customerEmail: input.customerEmail,
        customerName: input.customerName || null,
        customerPhone: input.customerPhone || null,
        description: input.description,
        imageUrls: input.imageUrls ? JSON.stringify(input.imageUrls) : null,
        status: "PENDING",
      });
      return { success: true };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { warrantyRequests } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(warrantyRequests).where(eq(warrantyRequests.userId, ctx.user.id)).orderBy(desc(warrantyRequests.createdAt));
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["PENDING", "PROCESSING", "RESOLVED", "REJECTED"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { warrantyRequests } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.update(warrantyRequests).set({ status: input.status, adminNote: input.adminNote || null }).where(and(eq(warrantyRequests.id, input.id), eq(warrantyRequests.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── Flash Sale Subscribers ───────────────────────────────────────────────
  flashSaleSubscriber: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const { flashSaleSubscribers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      // Use userId=1 as default owner (single-tenant)
      const [existing] = await drizzleDb.select().from(flashSaleSubscribers).where(eq(flashSaleSubscribers.email, input.email)).limit(1);
      if (existing) return { success: true, alreadySubscribed: true };
      await drizzleDb.insert(flashSaleSubscribers).values({ email: input.email, userId: 1 });
      return { success: true, alreadySubscribed: false };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { flashSaleSubscribers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(flashSaleSubscribers).where(eq(flashSaleSubscribers.userId, ctx.user.id)).orderBy(desc(flashSaleSubscribers.subscribedAt));
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const { flashSaleSubscribers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(flashSaleSubscribers).where(and(eq(flashSaleSubscribers.id, input.id), eq(flashSaleSubscribers.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── FAQ ─────────────────────────────────────────────────────────────────
  faq: router({
    listPublic: publicProcedure.query(async () => {
      const { faqs } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(faqs).where(eq(faqs.isPublished, true)).orderBy(asc(faqs.category), asc(faqs.sortOrder));
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { faqs } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(faqs).where(eq(faqs.userId, ctx.user.id)).orderBy(asc(faqs.category), asc(faqs.sortOrder));
    }),
    create: protectedProcedure.input(z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { faqs } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(faqs).values({ ...input, userId: ctx.user.id, category: input.category || "Chung" });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      question: z.string().optional(),
      answer: z.string().optional(),
      category: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { faqs } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { id, ...updates } = input;
      await drizzleDb.update(faqs).set(updates as any).where(and(eq(faqs.id, id), eq(faqs.userId, ctx.user.id)));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const { faqs } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(faqs).where(and(eq(faqs.id, input.id), eq(faqs.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── Refunds ─────────────────────────────────────────────────────────────
  refund: router({
    // Admin: list all refund requests
    list: protectedProcedure.query(async () => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(refunds).orderBy(desc(refunds.createdAt));
    }),
    // Admin: update refund status
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSED"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const updates: any = { status: input.status, adminNote: input.adminNote || null };
      if (input.status === "PROCESSED") updates.processedAt = new Date();
      await drizzleDb.update(refunds).set(updates).where(eq(refunds.id, input.id));
      return { success: true };
    }),
    // Customer: create refund request using session token
    customerCreate: publicProcedure.input(z.object({
      token: z.string(),
      invoiceId: z.number(),
      amount: z.number().min(1),
      reason: z.string().min(10),
    })).mutation(async ({ input }) => {
      const { customerSessions, customers, invoices: invoicesTable, refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      // Validate session
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || session.expiresAt < new Date()) throw new Error("Phiên đăng nhập hết hạn");
      // Get customer
      const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
      if (!customer) throw new Error("Không tìm thấy tài khoản khách hàng");
      // Verify invoice belongs to customer
      const [invoice] = await drizzleDb.select().from(invoicesTable)
        .where(and(eq(invoicesTable.id, input.invoiceId), eq(invoicesTable.customerId, customer.id))).limit(1);
      if (!invoice) throw new Error("Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn");
      // Only allow refund for FAILED or COMPLETED orders
      if (!(["FAILED", "COMPLETED", "PAID"].includes(invoice.status || ""))) {
        throw new Error("Chỉ có thể yêu cầu hoàn tiền cho đơn hàng thất bại hoặc đã hoàn thành");
      }
      // Check no existing pending refund for this invoice
      const existing = await drizzleDb.select().from(refunds)
        .where(and(eq(refunds.invoiceId, input.invoiceId), eq(refunds.status, "PENDING"))).limit(1);
      if (existing.length > 0) throw new Error("Đã có yêu cầu hoàn tiền đang chờ xử lý cho đơn hàng này");
      // Insert refund with customerId stored in userId field
      await drizzleDb.insert(refunds).values({
        invoiceId: input.invoiceId,
        userId: customer.id,
        amount: String(input.amount),
        reason: input.reason,
        status: "PENDING",
      });
      // Notify admin via Telegram
      void (async () => {
        try {
          const { notifyAdminRefund } = await import("./telegram");
          // Get invoice owner
          const [inv] = await drizzleDb.select({ userId: invoicesTable.userId }).from(invoicesTable).where(eq(invoicesTable.id, input.invoiceId)).limit(1);
          if (inv) {
            await notifyAdminRefund(inv.userId, {
              id: 0,
              customerName: customer.name || customer.email || "Khách hàng",
              customerEmail: customer.email || "",
              amount: input.amount,
              reason: input.reason,
            });
          }
        } catch {}
      })();
      return { success: true };
    }),
    // Customer: list own refund requests
    customerList: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { customerSessions, customers, refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || session.expiresAt < new Date()) return [];
      const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
      if (!customer) return [];
      return drizzleDb.select().from(refunds).where(eq(refunds.userId, customer.id)).orderBy(desc(refunds.createdAt));
    }),
  }),

  // ─── Tax Report ───────────────────────────────────────────────────────────
  taxReport: router({
    get: protectedProcedure.input(z.object({
      year: z.number(),
      quarter: z.number().min(1).max(4).optional(),
      month: z.number().min(1).max(12).optional(),
    })).query(async ({ input, ctx }) => {
      const { invoices } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and, gte, lte, sql } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { rows: [], summary: { totalRevenue: 0, totalTax: 0, totalDiscount: 0, netRevenue: 0, invoiceCount: 0 } };
      // Build date range
      let startDate: Date, endDate: Date;
      if (input.month) {
        startDate = new Date(input.year, input.month - 1, 1);
        endDate = new Date(input.year, input.month, 0, 23, 59, 59);
      } else if (input.quarter) {
        const startMonth = (input.quarter - 1) * 3;
        startDate = new Date(input.year, startMonth, 1);
        endDate = new Date(input.year, startMonth + 3, 0, 23, 59, 59);
      } else {
        startDate = new Date(input.year, 0, 1);
        endDate = new Date(input.year, 11, 31, 23, 59, 59);
      }
      const rows = await drizzleDb.select().from(invoices)
        .where(and(
          eq(invoices.userId, ctx.user.id),
          gte(invoices.createdAt, startDate),
          lte(invoices.createdAt, endDate)
        ));
      const summary = rows.reduce((acc, inv) => {
        const total = Number(inv.totalAmount || 0);
        const tax = Number(inv.taxAmount || 0);
        const discount = Number(inv.discountAmount || 0);
        acc.totalRevenue += total;
        acc.totalTax += tax;
        acc.totalDiscount += discount;
        acc.netRevenue += (total - tax);
        acc.invoiceCount++;
        return acc;
      }, { totalRevenue: 0, totalTax: 0, totalDiscount: 0, netRevenue: 0, invoiceCount: 0 });
      // Group by month for chart
      const byMonth: Record<string, { revenue: number; tax: number; count: number }> = {};
      rows.forEach(inv => {
        const key = new Date(inv.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!byMonth[key]) byMonth[key] = { revenue: 0, tax: 0, count: 0 };
        byMonth[key].revenue += Number(inv.totalAmount || 0);
        byMonth[key].tax += Number(inv.taxAmount || 0);
        byMonth[key].count++;
      });
      return { rows, summary, byMonth };
    }),
  }),
  // ─── VAT Invoice ───────────────────────────────────────────────────────────
  vatInvoice: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { vatInvoices } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(vatInvoices).where(eq(vatInvoices.userId, ctx.user.id)).orderBy(desc(vatInvoices.createdAt));
    }),
    create: protectedProcedure.input(z.object({
      invoiceId: z.number().optional(),
      companyName: z.string().min(1),
      taxCode: z.string().min(1),
      companyAddress: z.string().optional(),
      companyEmail: z.string().optional(),
      vatRate: z.number().default(10),
    })).mutation(async ({ input, ctx }) => {
      const { vatInvoices } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(vatInvoices).values({ ...input, userId: ctx.user.id, status: "PENDING" });
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["PENDING", "ISSUED", "CANCELLED"]),
    })).mutation(async ({ input, ctx }) => {
      const { vatInvoices } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.update(vatInvoices).set({ status: input.status }).where(and(eq(vatInvoices.id, input.id), eq(vatInvoices.userId, ctx.user.id)));
      return { success: true };
    }),
  }),

  // ─── Customer Auth (đăng nhập bằng email, không cần mật khẩu) ──────────────
  customer: router({
    // Đăng nhập: nhập email → tạo session token (30 ngày)
    login: publicProcedure
      .input(z.object({ email: z.string().email(), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        // Tạo token ngẫu nhiên
        const crypto = await import("crypto");
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
        // Lấy tên từ customers nếu có
        const { customers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [existingCustomer] = await drizzleDb.select({ name: customers.name }).from(customers).where(eq(customers.email, input.email)).limit(1);
        const name = input.name || existingCustomer?.name || input.email.split("@")[0];
        await drizzleDb.insert(customerSessions).values({ email: input.email, name, token, expiresAt });
        return { token, name, email: input.email, expiresAt };
      }),

    // Lấy thông tin khách từ token
    me: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const [session] = await drizzleDb.select().from(customerSessions)
          .where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return null;
        // Get walletBalance, avatarUrl AND name from customers table (persistent across sessions)
        const [cust] = await drizzleDb.select({
          walletBalance: customers.walletBalance,
          avatarUrl: (customers as any).avatarUrl,
          name: customers.name,
          telegramChatId: customers.telegramChatId,
          telegramUsername: customers.telegramUsername,
          telegramLinkedAt: customers.telegramLinkedAt,
          notifyOnLogin: customers.notifyOnLogin,
          notifyNewProduct: customers.notifyNewProduct,
          notifyFlashSale: customers.notifyFlashSale,
          notifyPromotion: customers.notifyPromotion,
          notifyOrderStatus: customers.notifyOrderStatus,
          notifyTelegramOrderStatus: customers.notifyTelegramOrderStatus,
          notifyTelegramPromotion: customers.notifyTelegramPromotion,
          notifyTelegramFlashSale: customers.notifyTelegramFlashSale,
          notifyTelegramOrderPaid: customers.notifyTelegramOrderPaid,
          notifyTelegramOrderShipping: customers.notifyTelegramOrderShipping,
          notifyTelegramOrderCompleted: customers.notifyTelegramOrderCompleted,
          notifyTelegramWarranty: customers.notifyTelegramWarranty,
        }).from(customers).where(eq(customers.email, session.email)).limit(1);
        const avatarUrl = (session as any).avatarUrl || (cust as any)?.avatarUrl || null;
        // If this is an admin session, also return role from users table
        // MySQL boolean can return true/false, 1/0, or Buffer - handle all cases
        const rawAdminFlag = (session as any).isAdminSession;
        const isAdminSession = rawAdminFlag === true || rawAdminFlag === 1 || rawAdminFlag === '1' ||
          (Buffer.isBuffer(rawAdminFlag) && rawAdminFlag[0] === 1);
        let role: string | null = null;
        if (isAdminSession) {
          const { users } = await import("../drizzle/schema");
          const [adminUser] = await drizzleDb.select({ role: users.role }).from(users).where(eq(users.email, session.email)).limit(1);
          role = adminUser?.role || null;
        }
        // Fallback: if email matches admin user directly, also return role
        if (!role) {
          const { users } = await import("../drizzle/schema");
          const [adminUser] = await drizzleDb.select({ role: users.role }).from(users).where(eq(users.email, session.email)).limit(1);
          if (adminUser?.role === 'admin') {
            role = 'admin';
          }
        }
        // Always use name from customers table (persistent) so profile edits are reflected immediately
        const displayName = cust?.name || session.name;
        // Normalize MySQL boolean fields (can be true/false, 1/0, or Buffer)
        const normBool = (v: any) => v === true || v === 1 || v === '1' || (Buffer.isBuffer(v) && v[0] === 1);
        return {
          email: session.email,
          name: displayName,
          avatarUrl,
          walletBalance: cust?.walletBalance || "0",
          role,
          telegramChatId: cust?.telegramChatId || null,
          telegramUsername: cust?.telegramUsername || null,
          telegramLinkedAt: cust?.telegramLinkedAt || null,
          notifyOnLogin: normBool(cust?.notifyOnLogin),
          notifyNewProduct: normBool(cust?.notifyNewProduct),
          notifyFlashSale: normBool(cust?.notifyFlashSale),
          notifyPromotion: normBool(cust?.notifyPromotion),
          notifyOrderStatus: normBool(cust?.notifyOrderStatus),
          notifyTelegramOrderStatus: normBool(cust?.notifyTelegramOrderStatus),
          notifyTelegramPromotion: normBool(cust?.notifyTelegramPromotion),
          notifyTelegramFlashSale: normBool(cust?.notifyTelegramFlashSale),
          notifyTelegramOrderPaid: normBool(cust?.notifyTelegramOrderPaid),
          notifyTelegramOrderShipping: normBool(cust?.notifyTelegramOrderShipping),
          notifyTelegramOrderCompleted: normBool(cust?.notifyTelegramOrderCompleted),
          notifyTelegramWarranty: normBool(cust?.notifyTelegramWarranty),
        };
      }),

    // Lịch sử đơn hàng của khách (theo email)
    myOrders: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, invoices: invoicesTable, customers, invoiceItems, products: productsTable } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        // Tìm customer theo email
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) return [];
        // Lấy hóa đơn của customer
        const orders = await drizzleDb.select().from(invoicesTable).where(eq(invoicesTable.customerId, customer.id));
        // Lấy items cho mỗi hóa đơn
        const result = await Promise.all(orders.map(async (order) => {
          const items = await drizzleDb.select({
            id: invoiceItems.id,
            productName: invoiceItems.name,
            quantity: invoiceItems.quantity,
            unitPrice: invoiceItems.unitPrice,
            total: invoiceItems.totalAmount,
          }).from(invoiceItems).where(eq(invoiceItems.invoiceId, order.id));
          return { ...order, items };
        }));
        return result;
      }),

    // Điểm tích lũy của khách
    myPoints: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, loyaltyPoints, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, sum } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { points: 0, history: [] };
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return { points: 0, history: [] };
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) return { points: 0, history: [] };
        const history = await drizzleDb.select().from(loyaltyPoints).where(eq(loyaltyPoints.customerEmail, session.email));
        const points = history.reduce((acc, h) => acc + h.points, 0);
        return { points, history };
      }),

    // Bảo hành của khách
    myWarranties: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, warranties, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) return [];
        return drizzleDb.select().from(warranties).where(eq(warranties.customerId, customer.id));
      }),

    // SP đã mua có bảo hành (để hiển thị trên trang bảo hành)
    myWarrantyProducts: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, invoices: invoicesTable, invoiceItems, customers, products: productsTable, productPackages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, inArray } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) return [];
        // Lấy đơn hàng PAID hoặc WARRANTY
        const paidOrders = await drizzleDb.select().from(invoicesTable).where(
          and(
            eq(invoicesTable.customerId, customer.id),
            inArray(invoicesTable.status, ["PAID", "WARRANTY", "SHIPPING"])
          )
        );
        if (paidOrders.length === 0) return [];
        // Lấy items từ các đơn hàng
        const orderIds = paidOrders.map(o => o.id);
        const allItems = await drizzleDb.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, orderIds));
        // Lấy thông tin sản phẩm
        const productIds = Array.from(new Set(allItems.filter(i => i.productId).map(i => i.productId!)));
        let productsMap: Record<number, any> = {};
        if (productIds.length > 0) {
          const prods = await drizzleDb.select().from(productsTable).where(inArray(productsTable.id, productIds));
          prods.forEach(p => { productsMap[p.id] = p; });
        }
        // Map items với thông tin bảo hành
        const result = allItems.map(item => {
          const order = paidOrders.find(o => o.id === item.invoiceId);
          const product = item.productId ? productsMap[item.productId] : null;
          return {
            id: item.id,
            invoiceId: item.invoiceId,
            invoiceNumber: order?.invoiceNumber || "",
            productId: item.productId,
            productName: item.name,
            productImage: product?.imageUrl || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            paidAt: order?.paidAt,
            warrantyMonths: order?.warrantyMonths || product?.warrantyMonths || 0,
            warrantyStartDate: order?.warrantyStartDate,
            warrantyExpiryDate: order?.warrantyExpiryDate,
            orderStatus: order?.status,
          };
        }).filter(item => item.warrantyMonths > 0); // Chỉ lấy SP có bảo hành
        return result;
      }),

    // Đăng xuất
    updateProfile: publicProcedure
      .input(z.object({ token: z.string(), name: z.string().optional(), phone: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        // Update session name
        if (input.name) {
          await drizzleDb.update(customerSessions).set({ name: input.name }).where(eq(customerSessions.token, input.token));
        }
        // Update customer record if exists
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (customer) {
          const updates: any = {};
          if (input.name) updates.name = input.name;
          if (input.phone) updates.phone = input.phone;
          if (Object.keys(updates).length > 0) {
            await drizzleDb.update(customers).set(updates).where(eq(customers.id, customer.id));
          }
        }
        return { success: true };
      }),

    updateNotificationPrefs: publicProcedure
      .input(z.object({
        token: z.string(),
        notifyOnLogin: z.boolean().optional(),
        notifyNewProduct: z.boolean().optional(),
        notifyFlashSale: z.boolean().optional(),
        notifyPromotion: z.boolean().optional(),
        notifyOrderStatus: z.boolean().optional(),
        notifyTelegramOrderStatus: z.boolean().optional(),
        notifyTelegramPromotion: z.boolean().optional(),
        notifyTelegramFlashSale: z.boolean().optional(),
        notifyTelegramOrderPaid: z.boolean().optional(),
        notifyTelegramOrderShipping: z.boolean().optional(),
        notifyTelegramOrderCompleted: z.boolean().optional(),
        notifyTelegramWarranty: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) throw new Error("Không tìm thấy tài khoản");
        const updates: any = {};
        if (input.notifyOnLogin !== undefined) updates.notifyOnLogin = input.notifyOnLogin;
        if (input.notifyNewProduct !== undefined) updates.notifyNewProduct = input.notifyNewProduct;
        if (input.notifyFlashSale !== undefined) updates.notifyFlashSale = input.notifyFlashSale;
        if (input.notifyPromotion !== undefined) updates.notifyPromotion = input.notifyPromotion;
        if (input.notifyOrderStatus !== undefined) updates.notifyOrderStatus = input.notifyOrderStatus;
        if (input.notifyTelegramOrderStatus !== undefined) updates.notifyTelegramOrderStatus = input.notifyTelegramOrderStatus;
        if (input.notifyTelegramPromotion !== undefined) updates.notifyTelegramPromotion = input.notifyTelegramPromotion;
        if (input.notifyTelegramFlashSale !== undefined) updates.notifyTelegramFlashSale = input.notifyTelegramFlashSale;
        if (input.notifyTelegramOrderPaid !== undefined) updates.notifyTelegramOrderPaid = input.notifyTelegramOrderPaid;
        if (input.notifyTelegramOrderShipping !== undefined) updates.notifyTelegramOrderShipping = input.notifyTelegramOrderShipping;
        if (input.notifyTelegramOrderCompleted !== undefined) updates.notifyTelegramOrderCompleted = input.notifyTelegramOrderCompleted;
        if (input.notifyTelegramWarranty !== undefined) updates.notifyTelegramWarranty = input.notifyTelegramWarranty;
        if (Object.keys(updates).length > 0) {
          await drizzleDb.update(customers).set(updates).where(eq(customers.id, customer.id));
        }
        return { success: true };
      }),
    unlinkTelegram: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) throw new Error("Không tìm thấy tài khoản");
        await drizzleDb.update(customers).set({ telegramChatId: null, telegramUsername: null, telegramLinkedAt: null }).where(eq(customers.id, customer.id));
        return { success: true };
      }),
    uploadAvatar: publicProcedure
      .input(z.object({ token: z.string(), dataUrl: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        const { storagePut } = await import("./storage");
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileKey = `avatars/${session.email.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        // Save avatar URL to both session AND customers table for persistence across logins
        await drizzleDb.update(customerSessions).set({ avatarUrl: url } as any).where(eq(customerSessions.token, input.token));
        const { customers } = await import("../drizzle/schema");
        const { users } = await import("../drizzle/schema");
        const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (owner) {
          await drizzleDb.update(customers).set({ avatarUrl: url, updatedAt: new Date() } as any)
            .where(eq(customers.email, session.email));
        }
        return { url };
      }),
    // Select avatar from gallery
    selectAvatar: publicProcedure
      .input(z.object({ token: z.string(), avatarUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        await drizzleDb.update(customerSessions).set({ avatarUrl: input.avatarUrl } as any).where(eq(customerSessions.token, input.token));
        await drizzleDb.update(customers).set({ avatarUrl: input.avatarUrl, updatedAt: new Date() } as any).where(eq(customers.email, session.email));
        return { url: input.avatarUrl };
      }),
    logout: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { success: false };
        await drizzleDb.delete(customerSessions).where(eq(customerSessions.token, input.token));
        return { success: true };
      }),

    // Đăng ký tài khoản mới với email + mật khẩu
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
        name: z.string().min(1, "Vui lòng nhập tên"),
        phone: z.string().optional(),
        origin: z.string().optional(),
        referralCode: z.string().optional(), // mã giới thiệu từ ?ref=CODE
      }))
      .mutation(async ({ input }) => {
        const { customers, customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        // Get owner
        const { users } = await import("../drizzle/schema");
        const [owner] = await drizzleDb.select().from(users).limit(1);
        if (!owner) throw new Error("Hệ thống chưa được cấu hình");
        // Check if email already registered
        const [existing] = await drizzleDb.select({ id: customers.id, passwordHash: customers.passwordHash })
          .from(customers)
          .where(and(eq(customers.userId, owner.id), eq(customers.email, input.email)))
          .limit(1);
        if (existing?.passwordHash) throw new Error("Email này đã được đăng ký");
        // Hash password
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.password, 10);
        const crypto = await import("crypto");
        const verificationToken = crypto.randomBytes(32).toString("hex");
        if (existing) {
          // Update existing customer with password
          await drizzleDb.update(customers).set({ passwordHash, name: input.name, phone: input.phone || null, emailVerified: false, emailVerificationToken: verificationToken, updatedAt: new Date() } as any).where(eq(customers.id, existing.id));
        } else {
          // Create new customer
          await drizzleDb.insert(customers).values({ userId: owner.id, name: input.name, email: input.email, phone: input.phone || null, passwordHash, emailVerified: false, emailVerificationToken: verificationToken } as any);
        }
        // Send verification email
        try {
          const { sendEmail } = await import("./email");
          const companyName = owner.name || "Hệ thống";
          const verifyUrl = `${input.origin || ""}/verify-email?token=${verificationToken}`;
          await sendEmail({
            userId: owner.id,
            to: input.email,
            subject: `Xác minh email - ${companyName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h2 style="color:#1e293b">Ðăng ký thành công!</h2>
                <p>Xin chào <strong>${input.name}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký. Vui lòng xác minh email để hoàn tất.</p>
                <p style="margin:24px 0"><a href="${verifyUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold">Xác minh email</a></p>
                <p style="color:#64748b;font-size:14px">Link có hiệu lực trong 24 giờ.</p>
              </div>
            `,
          });
        } catch { /* ignore email errors */ }
        // Create session (allow login even before verification)
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await drizzleDb.insert(customerSessions).values({ email: input.email, name: input.name, token, expiresAt });
         // Process referral code if provided
        if (input.referralCode) {
          try {
            const { customerReferralCodes } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const refDb = await getDb();
            if (refDb) {
              const [codeRow] = await refDb.select().from(customerReferralCodes)
                .where(eq(customerReferralCodes.code, input.referralCode.toUpperCase())).limit(1);
              if (codeRow && codeRow.email !== input.email) {
                // Record referral
                const { referrals } = await import("../drizzle/schema");
                await refDb.insert(referrals).values({
                  referrerEmail: codeRow.email,
                  refereeEmail: input.email,
                  referralCode: input.referralCode.toUpperCase(),
                }).catch(() => {}); // ignore duplicate
                // Update referrer stats
                await refDb.update(customerReferralCodes)
                  .set({ totalReferrals: (codeRow.totalReferrals || 0) + 1 } as any)
                  .where(eq(customerReferralCodes.id, codeRow.id));
              }
            }
          } catch (refErr) {
            console.error("[register] Referral error:", refErr);
          }
        }
        // Notify admin via Telegram: new customer registered
        void (async () => {
          try {
            const { notifyAdminNewCustomer } = await import("./telegram");
            await notifyAdminNewCustomer(owner.id, { name: input.name, email: input.email });
          } catch { /* silent */ }
        })();
        return { token, name: input.name, email: input.email, expiresAt, needsVerification: true };
      }),
    // Đăng nhập bằng email + mật khẩu
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { customers, customerSessions, users } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const bcrypt = await import("bcryptjs");
        const crypto = await import("crypto");

        // ── Check admin users table first ──────────────────────────────────────
        const [adminUser] = await drizzleDb.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (adminUser) {
          const validAdmin = await bcrypt.compare(input.password, adminUser.password);
          if (!validAdmin) throw new Error("Email hoặc mật khẩu không đúng");
          // Create customer session with isAdminSession flag
          const token = crypto.randomBytes(48).toString("hex");
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const name = adminUser.name || adminUser.email.split("@")[0];
          await drizzleDb.insert(customerSessions).values({
            email: adminUser.email,
            name,
            token,
            expiresAt,
            isAdminSession: true,
          } as any);
          // Record login history
          try {
            const { loginHistory } = await import("../drizzle/schema");
            await drizzleDb.insert(loginHistory).values({
              email: adminUser.email,
              status: "success",
              sessionToken: token,
              deviceInfo: "Admin login",
            } as any);
          } catch {}
          return { token, name, email: adminUser.email, expiresAt, role: adminUser.role };
        }

        // ── Fallback: check customers table ───────────────────────────────────
        const [owner] = await drizzleDb.select().from(users).limit(1);
        if (!owner) throw new Error("Hệ thống chưa được cấu hình");
        const [customer] = await drizzleDb.select()
          .from(customers)
          .where(and(eq(customers.userId, owner.id), eq(customers.email, input.email)))
          .limit(1);
        if (!customer) throw new Error("Email hoặc mật khẩu không đúng");
        if (!(customer as any).passwordHash) throw new Error("Tài khoản này chưa đăng ký mật khẩu. Vui lòng đăng ký.");
        // Check if account is locked
        if ((customer as any).lockedUntil && new Date((customer as any).lockedUntil) > new Date()) {
          const unlockTime = new Date((customer as any).lockedUntil).toLocaleTimeString("vi-VN");
          throw new Error(`Tài khoản bị khóa tạm thời do nhập sai quá nhiều lần. Thử lại sau ${unlockTime}`);
        }
        const valid = await bcrypt.compare(input.password, (customer as any).passwordHash);
        if (!valid) {
          // Increment login attempts
          const attempts = ((customer as any).loginAttempts || 0) + 1;
          const MAX_ATTEMPTS = 5;
          const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
          const updateData: any = { loginAttempts: attempts, updatedAt: new Date() };
          if (attempts >= MAX_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION);
            updateData.loginAttempts = 0;
          }
          await drizzleDb.update(customers).set(updateData).where(eq(customers.id, customer.id));
          const remaining = MAX_ATTEMPTS - attempts;
          if (remaining <= 0) {
            throw new Error("Tài khoản bị khóa 15 phút do nhập sai quá nhiều lần");
          }
          throw new Error(`Email hoặc mật khẩu không đúng. Còn ${remaining} lần thử`);
        }
        // Reset login attempts on success
        await drizzleDb.update(customers).set({ loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() } as any).where(eq(customers.id, customer.id));
        // Create session
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await drizzleDb.insert(customerSessions).values({ email: input.email, name: customer.name, token, expiresAt });
        // Record login history
        try {
          const { loginHistory } = await import("../drizzle/schema");
          await drizzleDb.insert(loginHistory).values({
            email: input.email,
            status: "success",
            sessionToken: token,
          } as any);
        } catch {}
        return { token, name: customer.name, email: input.email, expiresAt };
      }),
    // Quên mật khẩu - gửi email reset
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email(), origin: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const { users } = await import("../drizzle/schema");
        const [owner] = await drizzleDb.select().from(users).limit(1);
        if (!owner) throw new Error("Hệ thống chưa được cấu hình");
        const [customer] = await drizzleDb.select()
          .from(customers)
          .where(and(eq(customers.userId, owner.id), eq(customers.email, input.email)))
          .limit(1);
        // Always return success to prevent email enumeration
        if (!customer || !(customer as any).passwordHash) {
          return { success: true, message: "Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu" };
        }
        const crypto = await import("crypto");
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await drizzleDb.update(customers).set({
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
          updatedAt: new Date(),
        } as any).where(eq(customers.id, customer.id));
        // Send reset email via SMTP if configured
        try {
          const { sendEmail } = await import("./email");
          const companyName = owner.name || "Hệ thống";
          const resetUrl = `${input.origin || process.env.VITE_OAUTH_PORTAL_URL || ""}/client-login?resetToken=${resetToken}`;
          await sendEmail({
            userId: owner.id,
            to: input.email,
            subject: `Đặt lại mật khẩu - ${companyName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2>Đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ${input.email}.</p>
                <p><a href="${resetUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Đặt lại mật khẩu</a></p>
                <p>Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
              </div>
            `,
          });
        } catch { /* ignore email errors */ }
        return { success: true, message: "Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu", resetToken };
      }),
    // Xác nhận token và đặt lại mật khẩu
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
      }))
      .mutation(async ({ input }) => {
        const { customers, customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [customer] = await drizzleDb.select()
          .from(customers)
          .where(eq(customers.resetPasswordToken as any, input.token))
          .limit(1);
        if (!customer) throw new Error("Link đặt lại mật khẩu không hợp lệ");
        if ((customer as any).resetPasswordExpires && new Date((customer as any).resetPasswordExpires) < new Date()) {
          throw new Error("Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.");
        }
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.newPassword, 10);
        await drizzleDb.update(customers).set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          loginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        } as any).where(eq(customers.id, customer.id));
        // Create new session
        const crypto = await import("crypto");
        const sessionToken = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await drizzleDb.insert(customerSessions).values({ email: customer.email!, name: customer.name, token: sessionToken, expiresAt });
        return { success: true, token: sessionToken, name: customer.name, email: customer.email };
      }),

    // Xác minh email
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [customer] = await drizzleDb.select().from(customers)
          .where(eq(customers.emailVerificationToken as any, input.token)).limit(1);
        if (!customer) throw new Error("Link xác minh không hợp lệ hoặc đã hết hạn");
        await drizzleDb.update(customers).set({ emailVerified: true, emailVerificationToken: null, updatedAt: new Date() } as any).where(eq(customers.id, customer.id));
        return { success: true, email: customer.email, name: customer.name };
      }),
    // Đổi mật khẩu
    changePassword: publicProcedure
      .input(z.object({
        token: z.string(),
        oldPassword: z.string(),
        newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
      }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phiên đăng nhập hết hạn");
        const { users } = await import("../drizzle/schema");
        const [owner] = await drizzleDb.select().from(users).limit(1);
        const [customer] = await drizzleDb.select().from(customers)
          .where(and(eq(customers.userId, owner.id), eq(customers.email, session.email)))
          .limit(1);
        if (!customer) throw new Error("Tài khoản không tồn tại");
        const bcrypt = await import("bcryptjs");
        if ((customer as any).passwordHash) {
          const valid = await bcrypt.compare(input.oldPassword, (customer as any).passwordHash);
          if (!valid) throw new Error("Mật khẩu cũ không đúng");
        }
        const newHash = await bcrypt.hash(input.newPassword, 10);
        await drizzleDb.update(customers).set({ passwordHash: newHash, updatedAt: new Date() } as any).where(eq(customers.id, customer.id));
        return { success: true };
      }),
    // 2FA: Lấy QR code để setup
    setup2fa: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) throw new Error("Tài khoản không tồn tại");
        // Generate TOTP secret
        const crypto = await import("crypto");
        // Generate a random base32 secret for TOTP
        const rawBytes = crypto.randomBytes(20);
        const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let secret = "";
        for (let i = 0; i < 32; i++) {
          secret += base32Chars[rawBytes[i % 20] % 32];
        }
        await drizzleDb.update(customers).set({ totpSecret: secret } as any).where(eq(customers.id, customer.id));
        // Build otpauth URI
        const issuer = encodeURIComponent("PayOS Shop");
        const account = encodeURIComponent(session.email);
        const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
        // Generate QR code as data URL
        const QRCode = await import("qrcode");
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
        return { secret, qrDataUrl, otpauthUrl };
      }),
    // 2FA: Xác minh và bật
    verify2fa: publicProcedure
      .input(z.object({ token: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer || !(customer as any).totpSecret) throw new Error("Chưa cài đặt 2FA");
        // Verify TOTP code
        const OTPAuth = await import("otpauth");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32((customer as any).totpSecret), algorithm: "SHA1", digits: 6, period: 30 });
        const delta = totp.validate({ token: input.code, window: 1 });
        if (delta === null) throw new Error("Mã OTP không hợp lệ");
        await drizzleDb.update(customers).set({ totpEnabled: true } as any).where(eq(customers.id, customer.id));
        return { success: true };
      }),
    // 2FA: Tắt
    disable2fa: publicProcedure
      .input(z.object({ token: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer || !(customer as any).totpEnabled) throw new Error("2FA chưa được bật");
        const OTPAuth = await import("otpauth");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32((customer as any).totpSecret!), algorithm: "SHA1", digits: 6, period: 30 });
        const delta = totp.validate({ token: input.code, window: 1 });
        if (delta === null) throw new Error("Mã OTP không hợp lệ");
        await drizzleDb.update(customers).set({ totpEnabled: false, totpSecret: null } as any).where(eq(customers.id, customer.id));
        return { success: true };
      }),
    // Lấy trạng thái 2FA
    get2faStatus: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { enabled: false };
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return { enabled: false };
        const [customer] = await drizzleDb.select({ totpEnabled: customers.totpEnabled }).from(customers).where(eq(customers.email, session.email)).limit(1);
        return { enabled: !!(customer as any)?.totpEnabled };
      }),
    // Lịch sử đăng nhập
    getLoginHistory: publicProcedure
      .input(z.object({ token: z.string(), limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        const { customerSessions, loginHistory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, desc } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        const history = await drizzleDb.select().from(loginHistory)
          .where(eq(loginHistory.email, session.email))
          .orderBy(desc(loginHistory.createdAt))
          .limit(input.limit);
        return history;
      }),
    // Lấy danh sách phiên đang hoạt động
    getActiveSessions: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, gt } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        const sessions = await drizzleDb.select({
          id: customerSessions.id,
          token: customerSessions.token,
          createdAt: customerSessions.createdAt,
          expiresAt: customerSessions.expiresAt,
          isAdminSession: customerSessions.isAdminSession,
        }).from(customerSessions)
          .where(eq(customerSessions.email, session.email))
          .orderBy(customerSessions.createdAt);
        // Filter out expired sessions and mark current
        const now = new Date();
        return sessions
          .filter(s => s.expiresAt > now)
          .map(s => ({ ...s, isCurrent: s.token === input.token }));
      }),
    // Thu hồi phiên đăng nhập
    revokeSession: publicProcedure
      .input(z.object({ token: z.string(), sessionId: z.number() }))
      .mutation(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        // Only allow revoking sessions belonging to same email
        const [target] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.id, input.sessionId)).limit(1);
        if (!target || target.email !== session.email) throw new Error("Không có quyền thu hồi phiên này");
        if (target.token === input.token) throw new Error("Không thể thu hồi phiên hiện tại");
        await drizzleDb.delete(customerSessions).where(eq(customerSessions.id, input.sessionId));
        return { success: true };
      }),
    // Thu hồi tất cả phiên khác
    revokeAllOtherSessions: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, ne, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Phên đăng nhập hết hạn");
        await drizzleDb.delete(customerSessions).where(and(eq(customerSessions.email, session.email), ne(customerSessions.token, input.token)));
        return { success: true };
      }),
    // Check if the current customer session belongs to an admin user
    checkIsAdmin: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { customerSessions, users } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, or } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { isAdmin: false };
        const [session] = await drizzleDb.select().from(customerSessions)
          .where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return { isAdmin: false };
        // Check if session email matches any admin user
        const [adminUser] = await drizzleDb.select({ role: users.role }).from(users)
          .where(eq(users.email, session.email)).limit(1);
        if (adminUser?.role === 'admin') return { isAdmin: true };
        // Also check isAdminSession flag
        const rawAdminFlag = (session as any).isAdminSession;
        const isAdminSession = rawAdminFlag === true || rawAdminFlag === 1 || rawAdminFlag === '1' ||
          (Buffer.isBuffer(rawAdminFlag) && rawAdminFlag[0] === 1);
        return { isAdmin: isAdminSession };
      }),

    // Gửi tin nhắn test Telegram cho khách hàng
    sendTelegramTest: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new Error("Session expired");
        const [customer] = await drizzleDb.select().from(customers).where(eq(customers.email, session.email)).limit(1);
        if (!customer) throw new Error("Không tìm thấy tài khoản");
        if (!customer.telegramChatId) throw new Error("Bạn chưa liên kết Telegram");
        // Lấy bot token từ config
        const { getTelegramBotConfig } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner) throw new Error("Hệ thống chưa cấu hình");
        const config = await getTelegramBotConfig(owner.id, "user");
        if (!config?.botToken) throw new Error("Bot Telegram chưa được cấu hình");
        const { sendTelegramMessage } = await import("./telegram");
        const name = customer.name || session.name || "bạn";
        const text = `✅ *Tin nhắn thử nghiệm*\n\nXin chào *${name}*! Bot Telegram đã hoạt động đúng. Bạn sẽ nhận được thông báo đơn hàng tại đây.`;
        await sendTelegramMessage(config.botToken, customer.telegramChatId, text);
        return { success: true };
      }),
  }),
  // ─── Cartt ──────────────────────────────────────────────────────────────────
  cart: router({
    list: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { cartItems, products: productsTable, productPackages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, inArray } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const items = await drizzleDb.select().from(cartItems).where(eq(cartItems.sessionEmail, input.email));
      if (items.length === 0) return [];
      const productIds = Array.from(new Set(items.map(i => i.productId)));
      const prods = await drizzleDb.select().from(productsTable).where(inArray(productsTable.id, productIds));
      const packageIds = items.filter(i => i.packageId).map(i => i.packageId!);
      let pkgs: any[] = [];
      if (packageIds.length > 0) pkgs = await drizzleDb.select().from(productPackages).where(inArray(productPackages.id, packageIds));
      return items.map(item => ({
        ...item,
        product: prods.find(p => p.id === item.productId) || null,
        package: pkgs.find(pk => pk.id === item.packageId) || null,
      }));
    }),
    add: publicProcedure.input(z.object({
      email: z.string().email(),
      productId: z.number(),
      packageId: z.number().nullable().optional(),
      quantity: z.number().min(1).optional(),
      customFieldValues: z.array(z.object({ fieldName: z.string(), fieldValue: z.string() })).optional(),
    })).mutation(async ({ input }) => {
      const { cartItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const cfJson = input.customFieldValues ? JSON.stringify(input.customFieldValues) : null;
      // Check existing
      const conditions: any[] = [eq(cartItems.sessionEmail, input.email), eq(cartItems.productId, input.productId)];
      if (input.packageId) conditions.push(eq(cartItems.packageId, input.packageId));
      const [existing] = await drizzleDb.select().from(cartItems).where(and(...conditions)).limit(1);
      if (existing) {
        await drizzleDb.update(cartItems).set({ quantity: existing.quantity + (input.quantity || 1), customFieldValues: cfJson || existing.customFieldValues } as any).where(eq(cartItems.id, existing.id));
      } else {
        await drizzleDb.insert(cartItems).values({ sessionEmail: input.email, productId: input.productId, packageId: input.packageId || null, quantity: input.quantity || 1, customFieldValues: cfJson } as any);
      }
      return { success: true };
    }),
    updateQuantity: publicProcedure.input(z.object({ id: z.number(), quantity: z.number().min(1) })).mutation(async ({ input }) => {
      const { cartItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.update(cartItems).set({ quantity: input.quantity }).where(eq(cartItems.id, input.id));
      return { success: true };
    }),
    remove: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { cartItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(cartItems).where(eq(cartItems.id, input.id));
      return { success: true };
    }),
    clear: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const { cartItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(cartItems).where(eq(cartItems.sessionEmail, input.email));
      return { success: true };
    }),
    count: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { cartItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return 0;
      const [result] = await drizzleDb.select({ count: sql<number>`COUNT(*)` }).from(cartItems).where(eq(cartItems.sessionEmail, input.email));
      return result?.count || 0;
    }),
  }),

  // ─── Wishlist ──────────────────────────────────────────────────────────────
  wishlist: router({
    list: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { wishlists, products: productsTable, productPackages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, inArray } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const items = await drizzleDb.select().from(wishlists).where(eq(wishlists.sessionEmail, input.email));
      if (items.length === 0) return [];
      const productIds = items.map(i => i.productId);
      const prods = await drizzleDb.select().from(productsTable).where(inArray(productsTable.id, productIds));
      const pkgs = productIds.length > 0 ? await drizzleDb.select().from(productPackages).where(inArray(productPackages.productId, productIds)) : [];
      return items.map(item => ({
        ...item,
        product: prods.find(p => p.id === item.productId) || null,
        packages: pkgs.filter(pk => pk.productId === item.productId),
      }));
    }),
    toggle: publicProcedure.input(z.object({ email: z.string().email(), productId: z.number() })).mutation(async ({ input }) => {
      const { wishlists } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const [existing] = await drizzleDb.select().from(wishlists).where(and(eq(wishlists.sessionEmail, input.email), eq(wishlists.productId, input.productId))).limit(1);
      if (existing) {
        await drizzleDb.delete(wishlists).where(eq(wishlists.id, existing.id));
        return { added: false };
      } else {
        await drizzleDb.insert(wishlists).values({ sessionEmail: input.email, productId: input.productId });
        return { added: true };
      }
    }),
    check: publicProcedure.input(z.object({ email: z.string().email(), productId: z.number() })).query(async ({ input }) => {
      const { wishlists } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return false;
      const [existing] = await drizzleDb.select().from(wishlists).where(and(eq(wishlists.sessionEmail, input.email), eq(wishlists.productId, input.productId))).limit(1);
      return !!existing;
    }),
  }),

  // ─── Referral ─────────────────────────────────────────────────────────────
  referral: router({
    getSettings: publicProcedure.query(async () => {
      const { referralSettings, users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner) return null;
      const [s] = await drizzleDb.select().from(referralSettings).where(eq(referralSettings.userId, owner.id)).limit(1);
      return s || null;
    }),
    saveSettings: protectedProcedure.input(z.object({
      isEnabled: z.boolean(),
      rewardType: z.enum(["percentage", "fixed", "points"]),
      rewardAmount: z.number().min(0),
      minOrderAmount: z.number().min(0).optional(),
      description: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { referralSettings, featureFlags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const [existing] = await drizzleDb.select().from(referralSettings).where(eq(referralSettings.userId, ctx.user.id)).limit(1);
      if (existing) {
        await drizzleDb.update(referralSettings).set({ ...input, rewardAmount: String(input.rewardAmount), minOrderAmount: String(input.minOrderAmount || 0) } as any).where(eq(referralSettings.id, existing.id));
      } else {
        await drizzleDb.insert(referralSettings).values({ userId: ctx.user.id, ...input, rewardAmount: String(input.rewardAmount), minOrderAmount: String(input.minOrderAmount || 0) } as any);
      }
      // Sync featureFlags
      const flagKey = "referral";
      const existingFlag = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.key, flagKey)).limit(1);
      if (existingFlag.length > 0) {
        await drizzleDb.update(featureFlags).set({ enabled: input.isEnabled }).where(eq(featureFlags.key, flagKey));
      } else {
        await drizzleDb.insert(featureFlags).values({ key: flagKey, label: "Affiliate/Referral", description: "", enabled: input.isEnabled, category: "feature" });
      }
      // Sync userSettings (so Settings page toggle stays in sync)
      const { userSettings } = await import("../drizzle/schema");
      const existingUS = await drizzleDb.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
      if (existingUS.length > 0) {
        await drizzleDb.update(userSettings).set({ featureAffiliate: input.isEnabled }).where(eq(userSettings.userId, ctx.user.id));
      }
      return { success: true };
    }),
    getMyCode: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { customerReferralCodes } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const [code] = await drizzleDb.select().from(customerReferralCodes).where(eq(customerReferralCodes.email, input.email)).limit(1);
      if (code) return code;
      // Auto-generate code
      const newCode = "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await drizzleDb.insert(customerReferralCodes).values({ email: input.email, code: newCode });
      const [created] = await drizzleDb.select().from(customerReferralCodes).where(eq(customerReferralCodes.email, input.email)).limit(1);
      return created;
    }),
    getStats: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
      const { referrals, customerReferralCodes } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { code: null, totalReferrals: 0, totalRewards: "0", history: [] };
      const [codeRow] = await drizzleDb.select().from(customerReferralCodes).where(eq(customerReferralCodes.email, input.email)).limit(1);
      if (!codeRow) return { code: null, totalReferrals: 0, totalRewards: "0", history: [] };
      const history = await drizzleDb.select().from(referrals).where(eq(referrals.referrerEmail, input.email)).orderBy(desc(referrals.createdAt));
      return { code: codeRow.code, totalReferrals: codeRow.totalReferrals || 0, totalRewards: codeRow.totalRewards || "0", history };
    }),
    applyCode: publicProcedure.input(z.object({ code: z.string(), refereeEmail: z.string().email() })).mutation(async ({ input }) => {
      const { customerReferralCodes, referrals } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const [codeRow] = await drizzleDb.select().from(customerReferralCodes).where(eq(customerReferralCodes.code, input.code.toUpperCase())).limit(1);
      if (!codeRow) throw new Error("Mã giới thiệu không hợp lệ");
      if (codeRow.email === input.refereeEmail) throw new Error("Không thể tự giới thiệu");
      await drizzleDb.insert(referrals).values({ referrerEmail: codeRow.email, refereeEmail: input.refereeEmail, referralCode: input.code.toUpperCase() });
      await drizzleDb.update(customerReferralCodes).set({ totalReferrals: (codeRow.totalReferrals || 0) + 1 } as any).where(eq(customerReferralCodes.id, codeRow.id));
      return { success: true, referrerEmail: codeRow.email };
    }),
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Không có quyền truy cập" });
      const { referrals } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(referrals).orderBy(desc(referrals.createdAt)).limit(200);
    }),
    // Public: get referrer name by code (to show "Bạn được giới thiệu bởi [tên]")
    getReferrerByCode: publicProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => {
      const { customerReferralCodes, customers, users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const [codeRow] = await drizzleDb.select().from(customerReferralCodes)
        .where(eq(customerReferralCodes.code, input.code.toUpperCase())).limit(1);
      if (!codeRow) return null;
      const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner) return null;
      const [cust] = await drizzleDb.select({ name: customers.name })
        .from(customers)
        .where(eq(customers.email, codeRow.email))
        .limit(1);
      return { name: cust?.name || codeRow.email.split("@")[0], code: codeRow.code };
    }),
  }),

  // ─── Checkout (Customer-facing) ────────────────────────────────────────────
  checkout: router({
    // Buy Now: single product purchase
    buyNow: publicProcedure.input(z.object({
      email: z.string().email(),
      customerName: z.string().optional(),
      productId: z.number(),
      packageId: z.number(),
      quantity: z.number().min(1).optional(),
      couponCode: z.string().optional(),
      referralCode: z.string().optional(),
      customFieldValues: z.array(z.object({ fieldName: z.string(), fieldValue: z.string() })).optional(),
      notes: z.string().optional(),
      origin: z.string(), // window.location.origin
      payWithWallet: z.boolean().optional(),
      customerToken: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { products: productsTable, productPackages, customers, invoices, invoiceItems, users, paymentGatewaysConfig, coupons, couponUsages } = await import("../drizzle/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      // Get owner (first user)
      const [owner] = await drizzleDb.select().from(users).limit(1);
      if (!owner) throw new Error("Hệ thống chưa được cấu hình");

      // Get product + package
      const [product] = await drizzleDb.select().from(productsTable).where(eq(productsTable.id, input.productId)).limit(1);
      if (!product) throw new Error("Sản phẩm không tồn tại");
      const [pkg] = await drizzleDb.select().from(productPackages).where(eq(productPackages.id, input.packageId)).limit(1);
      if (!pkg) throw new Error("Gói sản phẩm không tồn tại");

      const qty = input.quantity || 1;

      // Check inventory: block order if out of stock
      if (product.inventoryType === "warehouse") {
        const { productInventory: invTable } = await import("../drizzle/schema");
        const invItems = await drizzleDb.select().from(invTable)
          .where(and(eq(invTable.productId, input.productId), eq(invTable.status, "available")))
          .limit(qty);
        if (invItems.length < qty) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Sản phẩm đã hết hàng trong kho. Hiện chỉ còn ${invItems.length} sản phẩm.` });
        }
      }

      // Determine price based on customer role
      let unitPrice = Number(pkg.price);
      if (input.customerToken) {
        try {
          const { customerSessions } = await import("../drizzle/schema");
          const [sess] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.customerToken)).limit(1);
          if (sess) {
            const [cust] = await drizzleDb.select({ customerRole: customers.customerRole }).from(customers)
              .where(and(eq(customers.userId, owner.id), eq(customers.email, sess.email))).limit(1);
            if (cust?.customerRole === "vip" && pkg.priceVip) unitPrice = Number(pkg.priceVip);
            else if (cust?.customerRole === "wholesale" && pkg.priceWholesale) unitPrice = Number(pkg.priceWholesale);
            else if (cust?.customerRole === "partner" && pkg.pricePartner) unitPrice = Number(pkg.pricePartner);
          }
        } catch { /* use default price */ }
      }
      const subtotal = unitPrice * qty;

      // Apply coupon if provided
      let discountAmount = 0;
      let couponId: number | null = null;
      if (input.couponCode) {
        const [coupon] = await drizzleDb.select().from(coupons).where(eq(coupons.code, input.couponCode.toUpperCase())).limit(1);
        if (coupon && coupon.isActive) {
          couponId = coupon.id;
          if (coupon.discountType === "percent") {
            discountAmount = subtotal * Number(coupon.discountValue) / 100;
            const maxDisc = Number(coupon.maxDiscountAmount || 0);
            if (maxDisc > 0 && discountAmount > maxDisc) discountAmount = maxDisc;
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          if (discountAmount > subtotal) discountAmount = subtotal;
          discountAmount = Math.round(discountAmount);
          // Record coupon usage (defer until invoice is created)
          await drizzleDb.update(coupons).set({ usedCount: (coupon.usedCount || 0) + 1 } as any).where(eq(coupons.id, coupon.id));
        }
      }

        // Apply tax from taxSettings (skip if paying with wallet)
      let buyNowTaxAmount = 0;
      if (!input.payWithWallet) {
        try {
          const { taxSettings } = await import("../drizzle/schema");
          const [taxSetting] = await drizzleDb.select().from(taxSettings).where(and(eq(taxSettings.userId, owner.id), eq(taxSettings.isEnabled, true))).limit(1);
          if (taxSetting && taxSetting.isEnabled) {
            const rate = Number(taxSetting.taxRate || 0);
            buyNowTaxAmount = Math.round((subtotal - discountAmount) * rate / 100);
          }
        } catch {}
      }
      const totalAmount = Math.max(subtotal - discountAmount + buyNowTaxAmount, 0);
      // Find or create customer
      let [customer] = await drizzleDb.select().from(customers).where(and(eq(customers.userId, owner.id), eq(customers.email, input.email))).limit(1);
      if (!customer) {
        await drizzleDb.insert(customers).values({
          userId: owner.id,
          name: input.customerName || input.email.split("@")[0],
          email: input.email,
        } as any);
        [customer] = await drizzleDb.select().from(customers).where(and(eq(customers.userId, owner.id), eq(customers.email, input.email))).limit(1);
      }
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const orderCode = Date.now() % 9007199254740991;
      // Create invoice
      await drizzleDb.insert(invoices).values({
        userId: owner.id,
        invoiceNumber,
        customerId: customer.id,
        currency: "VND",
        subtotal: String(subtotal),
        discountAmount: String(discountAmount),
         discountCodeId: couponId,
        taxAmount: String(buyNowTaxAmount),
        totalAmount: String(totalAmount),
        status: "CREATED",
          paymentMethod: "PAYOS",
        payosOrderCode: String(orderCode),
        notes: input.notes || null,
        orderInfo: input.customFieldValues ? JSON.stringify(input.customFieldValues) : null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      } as any);
      // Get created invoice
      const [createdInvoice] = await drizzleDb.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
      if (!createdInvoice) throw new Error("Không thể tạo đơn hàng");
      // Record coupon usage with invoiceId
      if (couponId && discountAmount > 0) {
        await drizzleDb.insert(couponUsages).values({ couponId, invoiceId: createdInvoice.id, customerEmail: input.email, discountAmount: String(discountAmount) } as any);
      }
      // Create invoice item
      await drizzleDb.insert(invoiceItems).values({
        invoiceId: createdInvoice.id,
        productId: input.productId,
        name: `${product.name} - ${pkg.name}`,
        quantity: String(qty),
        unitPrice: String(unitPrice),
        discount: "0",
        taxAmount: "0",
        totalAmount: String(unitPrice * qty),
      } as any);

      // If paying with wallet, deduct balance immediately
      if (input.payWithWallet && input.customerToken) {
        const { customerSessions, walletTransactions } = await import("../drizzle/schema");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.customerToken)).limit(1);
        if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Phiên đăng nhập không hợp lệ" });
        const [walletCustomer] = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, session.email)).limit(1);
        const walletBal = parseFloat(walletCustomer?.walletBalance?.toString() || "0");
        if (walletBal < totalAmount) throw new TRPCError({ code: "BAD_REQUEST", message: `Số dư ví không đủ. Cần ${totalAmount.toLocaleString("vi-VN")}đ, hiện có ${walletBal.toLocaleString("vi-VN")}đ` });
        const newBal = walletBal - totalAmount;
        await drizzleDb.update(customers).set({ walletBalance: String(newBal) } as any).where(eq(customers.email, session.email));
        await drizzleDb.insert(walletTransactions).values({
          customerEmail: session.email,
          type: "spend",
          amount: String(totalAmount),
          balanceBefore: String(walletBal),
          balanceAfter: String(newBal),
          description: `Thanh toán đơn hàng ${invoiceNumber}`,
          invoiceId: createdInvoice.id,
          status: "completed",
        });
        await drizzleDb.update(invoices).set({ status: "PAID", paymentMethod: "WALLET" } as any).where(eq(invoices.id, createdInvoice.id));
        await drizzleDb.update(customers).set({ totalPaid: String(parseFloat(customer.totalPaid || "0") + totalAmount) } as any).where(eq(customers.id, customer.id));
        return { success: true, invoiceId: createdInvoice.id, invoiceNumber, paymentUrl: "", qrCode: "" };
      }
      // Create PayOS payment link
      let paymentUrl = "";
      let qrCode = "";
      try {
        const [gatewayConfig] = await drizzleDb.select().from(paymentGatewaysConfig).where(eq(paymentGatewaysConfig.userId, owner.id)).limit(1);
        if (gatewayConfig?.payosApiKey && gatewayConfig?.payosClientId && gatewayConfig?.payosChecksumKey) {
          const payosResult = await createPayOSPaymentLink(
            {
              clientId: gatewayConfig.payosClientId,
              apiKey: gatewayConfig.payosApiKey,
              checksumKey: gatewayConfig.payosChecksumKey,
            },
            {
              orderCode,
              amount: Math.round(totalAmount),
              description: `TT ${invoiceNumber}`.slice(0, 25),
              buyerName: customer.name || "Khach hang",
              buyerEmail: customer.email || "",
              buyerPhone: customer.phone || "",
              buyerAddress: customer.address || "",
              returnUrl: `${input.origin}/track-order`,
              cancelUrl: `${input.origin}/payment-cancel?type=order&orderCode=${orderCode}`,
            }
          );
          paymentUrl = payosResult.checkoutUrl;
          qrCode = payosResult.qrCode;
          // Update invoice with payment info
          await drizzleDb.update(invoices).set({
            paymentUrl,
            qrCode,
            paymentTransactionId: String(payosResult.paymentLinkId),
          } as any).where(eq(invoices.id, createdInvoice.id));
        } else {
          throw new Error("Chưa cấu hình PayOS. Vui lòng liên hệ admin.");
        }
      } catch (err: any) {
        // PayOS failed: log but still return invoice so customer can track order
        console.error("[checkout.buyNow] PayOS error:", err);
        // paymentUrl stays empty - frontend will redirect to track-order
      }

      // Send email to customer with payment link (only if customer has notifyOrderStatus enabled)
      try {
        const shouldSendEmail = !customer || customer.notifyOrderStatus !== false;
        if (shouldSendEmail) {
          const db = await import("./db");
          const userSettings = await db.getUserSettings(owner.id);
          const companyName = userSettings?.companyName || "";
          const paymentPageUrl = paymentUrl || `${input.origin}/pay/${createdInvoice.id}`;
          const customTemplate = await db.getEmailTemplateByType(owner.id, "CREATED").catch(() => null);
          const replaceVars = (str: string) => str
            .replace(/{{customerName}}/g, customer.name || input.email)
            .replace(/{{invoiceNumber}}/g, invoiceNumber)
            .replace(/{{totalAmount}}/g, `${totalAmount.toLocaleString("vi-VN")} đ`)
            .replace(/{{status}}/g, "Chờ thanh toán")
            .replace(/{{trackUrl}}/g, `${input.origin}/track-order`)
            .replace(/{{reviewUrl}}/g, "")
            .replace(/{{companyName}}/g, companyName)
            .replace(/{{paymentUrl}}/g, paymentPageUrl);
          let html: string;
          let subject: string;
          if (customTemplate) {
            html = replaceVars(customTemplate.htmlBody);
            subject = replaceVars(customTemplate.subject);
          } else {
            html = generateInvoiceEmailHTML({
              invoiceNumber,
              customerName: customer.name || input.email,
              totalAmount,
              currency: "VND",
              companyName,
              paymentUrl: paymentPageUrl,
            });
            subject = `Hóa Đơn ${invoiceNumber} - Link Thanh Toán`;
          }
          await sendEmail({ to: input.email, subject, html, userId: owner.id });
        }
      } catch (emailErr) {
        console.error("[checkout.buyNow] Email error:", emailErr);
      }

      // Send Telegram Admin notification
      void (async () => {
        try {
          const { notifyAdminNewOrder } = await import("./telegram");
          await notifyAdminNewOrder(owner.id, {
            id: createdInvoice.id,
            orderCode: invoiceNumber,
            customerName: customer.name || input.email,
            customerEmail: input.email,
            totalAmount,
            currency: "VND",
            productName: `${product.name} - ${pkg.name}`,
          });
        } catch {}
      })();
      // Create customer notification
      try {
        const { customerNotifications } = await import("../drizzle/schema");
        const drizzleDb2 = await getDb();
        if (drizzleDb2) {
          await drizzleDb2.insert(customerNotifications).values({
            userId: owner.id,
            customerEmail: input.email,
            title: `Đặt hàng thành công - ${invoiceNumber}`,
            message: `Bạn đã đặt hàng ${product.name} - ${pkg.name} với tổng tiền ${totalAmount.toLocaleString("vi-VN")}đ. Mã đơn: ${invoiceNumber}`,
            type: "order" as any,
            link: `/order/${invoiceNumber}`,
          });
        }
      } catch (_) {}
      return { success: true, invoiceId: createdInvoice.id, invoiceNumber, paymentUrl, qrCode };
    }),

    // Cart checkout: multiple products
    cartCheckout: publicProcedure.input(z.object({
      email: z.string().email(),
      customerName: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        packageId: z.number().nullable().optional(),
        name: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number(),
        customFieldValues: z.string().optional(), // JSON string
      })),
      couponCode: z.string().optional(),
      referralCode: z.string().optional(),
      notes: z.string().optional(),
      origin: z.string(),
      payWithWallet: z.boolean().optional(), // thanh toán bằng số dư ví
      customerToken: z.string().optional(), // token xác thực để dùng ví
    })).mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { customers, invoices, invoiceItems, users, paymentGatewaysConfig, coupons, couponUsages } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      if (input.items.length === 0) throw new Error("Giỏ hàng trống");

      // Get owner
      const [owner] = await drizzleDb.select().from(users).limit(1);
      if (!owner) throw new Error("Hệ thống chưa được cấu hình");

      // Check inventory for each item
      const { products: productsTable2, productInventory: invTable2 } = await import("../drizzle/schema");
      for (const item of input.items) {
        const [prod] = await drizzleDb.select({ inventoryType: productsTable2.inventoryType }).from(productsTable2).where(eq(productsTable2.id, item.productId)).limit(1);
        if (prod?.inventoryType === "warehouse") {
          const invItems = await drizzleDb.select().from(invTable2)
            .where(and(eq(invTable2.productId, item.productId), eq(invTable2.status, "available")))
            .limit(item.quantity);
          if (invItems.length < item.quantity) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Sản phẩm "${item.name}" đã hết hàng. Hiện chỉ còn ${invItems.length} sản phẩm.` });
          }
        }
      }

      const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      // Apply coupon
      let discountAmount = 0;
      let couponId: number | null = null;
      if (input.couponCode) {
        const [coupon] = await drizzleDb.select().from(coupons).where(eq(coupons.code, input.couponCode.toUpperCase())).limit(1);
        if (coupon && coupon.isActive) {
          couponId = coupon.id;
          if (coupon.discountType === "percent") {
            discountAmount = subtotal * Number(coupon.discountValue) / 100;
            const maxDisc = Number(coupon.maxDiscountAmount || 0);
            if (maxDisc > 0 && discountAmount > maxDisc) discountAmount = maxDisc;
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          if (discountAmount > subtotal) discountAmount = subtotal;
          discountAmount = Math.round(discountAmount);
          await drizzleDb.update(coupons).set({ usedCount: (coupon.usedCount || 0) + 1 } as any).where(eq(coupons.id, coupon.id));
        }
      }

       // Apply tax from taxSettings
      let taxAmount = 0;
      let taxRate = 0;
      try {
        const { taxSettings } = await import("../drizzle/schema");
        const [taxSetting] = await drizzleDb.select().from(taxSettings).where(and(eq(taxSettings.userId, owner.id), eq(taxSettings.isEnabled, true))).limit(1);
        if (taxSetting && taxSetting.isEnabled) {
          taxRate = Number(taxSetting.taxRate || 0);
          taxAmount = Math.round((subtotal - discountAmount) * taxRate / 100);
        }
      } catch {}
      const totalAmount = Math.max(subtotal - discountAmount + taxAmount, 0);
      // Find or create customer
      let [customer] = await drizzleDb.select().from(customers).where(and(eq(customers.userId, owner.id), eq(customers.email, input.email))).limit(1);
      if (!customer) {
        await drizzleDb.insert(customers).values({
          userId: owner.id,
          name: input.customerName || input.email.split("@")[0],
          email: input.email,
        } as any);
        [customer] = await drizzleDb.select().from(customers).where(and(eq(customers.userId, owner.id), eq(customers.email, input.email))).limit(1);
      }

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const orderCode = Date.now() % 9007199254740991;

      // Create invoice
      await drizzleDb.insert(invoices).values({
        userId: owner.id,
        invoiceNumber,
        customerId: customer.id,
        currency: "VND",
        subtotal: String(subtotal),
        discountAmount: String(discountAmount),
        discountCodeId: couponId,
        taxAmount: String(taxAmount),
        totalAmount: String(totalAmount),
        status: "CREATED",
        paymentMethod: "PAYOS",
        payosOrderCode: String(orderCode),
        notes: input.notes || null,
        orderInfo: input.items.some((i: any) => i.customFieldValues) ? JSON.stringify(input.items.map((i: any) => ({ productId: i.productId, customFieldValues: i.customFieldValues ? JSON.parse(i.customFieldValues) : null }))) : null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any);
      const [createdInvoice] = await drizzleDb.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
      if (!createdInvoice) throw new Error("Không thể tạo đơn hàng");
      // Record coupon usage
      if (couponId && discountAmount > 0) {
        await drizzleDb.insert(couponUsages).values({ couponId, invoiceId: createdInvoice.id, customerEmail: input.email, discountAmount: String(discountAmount) } as any);
      }

      // Create invoice items
      for (const item of input.items) {
        await drizzleDb.insert(invoiceItems).values({
          invoiceId: createdInvoice.id,
          productId: item.productId,
          name: item.name,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          discount: "0",
          taxAmount: "0",
          totalAmount: String(item.unitPrice * item.quantity),
        } as any);
      }

      // Wallet payment or PayOS payment
      let paymentUrl = "";
      let qrCode = "";
      if (input.payWithWallet && input.customerToken && totalAmount > 0) {
        // Pay with wallet balance
        const { customerSessions, walletTransactions } = await import("../drizzle/schema");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.customerToken)).limit(1);
        if (!session) throw new Error("Phiên đăng nhập không hợp lệ");
        const [walletCustomer] = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, session.email)).limit(1);
        const currentBalance = parseFloat(walletCustomer?.walletBalance?.toString() || "0");
        if (currentBalance < totalAmount) {
          throw new Error(`Số dư ví không đủ. Hiện tại: ${currentBalance.toLocaleString("vi-VN")}d, cần: ${totalAmount.toLocaleString("vi-VN")}d`);
        }
        const newBalance = currentBalance - totalAmount;
        await drizzleDb.update(customers).set({ walletBalance: newBalance.toString() } as any).where(eq(customers.email, session.email));
        await drizzleDb.insert(walletTransactions).values({
          customerEmail: session.email,
          type: "spend",
          amount: totalAmount.toString(),
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString(),
          description: `Thanh toán đơn hàng ${invoiceNumber}`,
          invoiceId: createdInvoice.id,
          status: "completed",
        });
        await drizzleDb.update(invoices).set({ status: "PAID", paymentMethod: "WALLET" } as any).where(eq(invoices.id, createdInvoice.id));
        // Update customer total paid
        await drizzleDb.update(customers).set({ totalPaid: String((parseFloat(customer.totalPaid || "0") + totalAmount)) } as any).where(eq(customers.id, customer.id));
      } else {
        // Create PayOS payment link
        try {
          const [gatewayConfig] = await drizzleDb.select().from(paymentGatewaysConfig).where(eq(paymentGatewaysConfig.userId, owner.id)).limit(1);
          if (gatewayConfig?.payosApiKey && gatewayConfig?.payosClientId && gatewayConfig?.payosChecksumKey) {
            const payosResult = await createPayOSPaymentLink(
              {
                clientId: gatewayConfig.payosClientId,
                apiKey: gatewayConfig.payosApiKey,
                checksumKey: gatewayConfig.payosChecksumKey,
              },
              {
                orderCode,
                amount: Math.round(totalAmount),
                description: `TT ${invoiceNumber}`.slice(0, 25),
                buyerName: customer.name || "Khach hang",
                buyerEmail: customer.email || "",
                buyerPhone: customer.phone || "",
                buyerAddress: customer.address || "",
                returnUrl: `${input.origin}/track-order`,
                cancelUrl: `${input.origin}/payment-cancel?type=order&orderCode=${orderCode}`,
              }
            );
            paymentUrl = payosResult.checkoutUrl;
            qrCode = payosResult.qrCode;
            await drizzleDb.update(invoices).set({
              paymentUrl,
              qrCode,
              paymentTransactionId: String(payosResult.paymentLinkId),
            } as any).where(eq(invoices.id, createdInvoice.id));
          } else {
            throw new Error("Chưa cấu hình PayOS. Vui lòng liên hệ admin.");
          }
        } catch (err: any) {
          // PayOS failed: log but still return invoice so customer can track order
          console.error("[checkout.cartCheckout] PayOS error:", err);
          // paymentUrl stays empty - frontend will redirect to track-order
        }
      }

      // Send email to customer with payment link (same as admin manual invoice)
      try {
        const db = await import("./db");
        const userSettings = await db.getUserSettings(owner.id);
        const companyName = userSettings?.companyName || "";
        const paymentPageUrl = paymentUrl || `${input.origin}/pay/${createdInvoice.id}`;
        const customTemplate = await db.getEmailTemplateByType(owner.id, "CREATED").catch(() => null);
        const replaceVars = (str: string) => str
          .replace(/{{customerName}}/g, customer.name || input.email)
          .replace(/{{invoiceNumber}}/g, invoiceNumber)
          .replace(/{{totalAmount}}/g, `${totalAmount.toLocaleString("vi-VN")} đ`)
          .replace(/{{status}}/g, "Chờ thanh toán")
          .replace(/{{trackUrl}}/g, `${input.origin}/track-order`)
          .replace(/{{reviewUrl}}/g, "")
          .replace(/{{companyName}}/g, companyName)
          .replace(/{{paymentUrl}}/g, paymentPageUrl);
        let html: string;
        let subject: string;
        if (customTemplate) {
          html = replaceVars(customTemplate.htmlBody);
          subject = replaceVars(customTemplate.subject);
        } else {
          const itemNamesForEmail = input.items.map(i => `${i.name} x${i.quantity}`).join(", ");
          html = generateInvoiceEmailHTML({
            invoiceNumber,
            customerName: customer.name || input.email,
            totalAmount,
            currency: "VND",
            companyName,
            paymentUrl: paymentPageUrl,
          });
          subject = `Hóa Đơn ${invoiceNumber} - Link Thanh Toán`;
        }
        await sendEmail({ to: input.email, subject, html, userId: owner.id });
      } catch (emailErr) {
        console.error("[checkout.cartCheckout] Email error:", emailErr);
      }

      // Send Telegram Admin notification
      void (async () => {
        try {
          const { notifyAdminNewOrder } = await import("./telegram");
          const itemNames = input.items.map(i => `${i.name} x${i.quantity}`).join(", ");
          await notifyAdminNewOrder(owner.id, {
            id: createdInvoice.id,
            orderCode: invoiceNumber,
            customerName: customer.name || input.email,
            customerEmail: input.email,
            totalAmount,
            currency: "VND",
            productName: itemNames,
          });
        } catch {}
      })();
      // Create customer notification
      try {
        const { customerNotifications } = await import("../drizzle/schema");
        const drizzleDb2 = await getDb();
        if (drizzleDb2) {
          const itemCount = input.items.reduce((s, i) => s + i.quantity, 0);
          await drizzleDb2.insert(customerNotifications).values({
            userId: owner.id,
            customerEmail: input.email,
            title: `Đặt hàng thành công - ${invoiceNumber}`,
            message: `Bạn đã đặt ${itemCount} sản phẩm với tổng tiền ${totalAmount.toLocaleString("vi-VN")}đ. Mã đơn: ${invoiceNumber}`,
            type: "order" as any,
            link: `/order/${invoiceNumber}`,
          });
        }
      } catch (_) {}
      return { success: true, invoiceId: createdInvoice.id, invoiceNumber, paymentUrl, qrCode };
    }),
  }),
  // ─── Wallet Router ────────────────────────────────────────────────────────
  wallet: router({
    getBalance: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customerSessions, customers } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const session = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session[0]) throw new TRPCError({ code: "UNAUTHORIZED" });
        const customer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, session[0].email)).limit(1);
        return { balance: parseFloat(customer[0]?.walletBalance || "0") };
      }),

    getTransactions: publicProcedure
      .input(z.object({
        token: z.string(),
        limit: z.number().default(50),
        type: z.enum(["all", "topup", "spend", "refund", "reward"]).default("all"),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, desc, and, gte, lte, like } = await import("drizzle-orm");
        const { customerSessions, walletTransactions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const session = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session[0]) throw new TRPCError({ code: "UNAUTHORIZED" });
        const conditions: any[] = [eq(walletTransactions.customerEmail, session[0].email)];
        if (input.type && input.type !== "all") conditions.push(eq(walletTransactions.type, input.type as any));
        if (input.dateFrom) conditions.push(gte(walletTransactions.createdAt, new Date(input.dateFrom)));
        if (input.dateTo) {
          const end = new Date(input.dateTo);
          end.setHours(23, 59, 59, 999);
          conditions.push(lte(walletTransactions.createdAt, end));
        }
        if (input.search) conditions.push(like(walletTransactions.description, `%${input.search}%`));
        return drizzleDb.select().from(walletTransactions)
          .where(and(...conditions))
          .orderBy(desc(walletTransactions.createdAt))
          .limit(input.limit);
      }),

    topup: publicProcedure
      .input(z.object({ token: z.string(), amount: z.number().min(10000), returnUrl: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb, getPaymentGatewaysConfigByUserId } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customerSessions, customers, walletTransactions, users } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const session = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session[0]) throw new TRPCError({ code: "UNAUTHORIZED" });
        const owner = await drizzleDb.select().from(users).limit(1);
        if (!owner[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // getPaymentGatewaysConfigByUserId returns a single row (the config object)
        const gatewayConfig = await getPaymentGatewaysConfigByUserId(owner[0].id);
        if (!gatewayConfig || !gatewayConfig.payosApiKey) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "PayOS chưa được cấu hình" });
        }
        const orderCode = Date.now() % 9007199254740991; // unique numeric order code
        const paymentResult = await createPayOSPaymentLink(
          {
            apiKey: gatewayConfig.payosApiKey || "",
            clientId: gatewayConfig.payosClientId || "",
            checksumKey: gatewayConfig.payosChecksumKey || "",
          },
          {
            orderCode,
            amount: Math.round(input.amount),
            description: `NAP VI ${session[0].email.split("@")[0].substring(0, 10)}`.slice(0, 25),
            buyerName: session[0].name || session[0].email.split("@")[0],
            buyerEmail: session[0].email,
            buyerPhone: "",
            buyerAddress: "",
            returnUrl: input.returnUrl,
            cancelUrl: `${new URL(input.returnUrl).origin}/payment-cancel?type=wallet&orderCode=${orderCode}`,
          }
        );
        const paymentUrl = paymentResult.checkoutUrl;
        const currentCustomer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, session[0].email)).limit(1);
        const currentBalance = parseFloat(currentCustomer[0]?.walletBalance || "0");
        await drizzleDb.insert(walletTransactions).values({
          customerEmail: session[0].email,
          type: "topup",
          amount: input.amount.toString(),
          balanceBefore: currentBalance.toString(),
          balanceAfter: currentBalance.toString(),
          description: `Nạp ví qua PayOS`,
          payosOrderCode: orderCode,
          status: "pending",
        });
        return { paymentUrl, orderCode };
      }),

    adminCredit: protectedProcedure
      .input(z.object({ customerEmail: z.string().email(), amount: z.number(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Không có quyền truy cập" });
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { customers, walletTransactions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const customer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, input.customerEmail)).limit(1);
        if (!customer[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy khách hàng" });
        const currentBalance = parseFloat(customer[0].walletBalance || "0");
        const newBalance = currentBalance + input.amount;
        await drizzleDb.update(customers).set({ walletBalance: newBalance.toString() }).where(eq(customers.email, input.customerEmail));
        await drizzleDb.insert(walletTransactions).values({
          customerEmail: input.customerEmail,
          type: input.amount >= 0 ? "topup" : "spend",
          amount: Math.abs(input.amount).toString(),
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString(),
          description: input.description || `Admin điều chỉnh số dư`,
          status: "completed",
        });
        return { success: true, newBalance };
      }),

    adminList: protectedProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0), email: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Không có quyền truy cập" });
        const { getDb } = await import("./db");
        const { desc, like, and } = await import("drizzle-orm");
        const { walletTransactions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const conditions = input.email ? [like(walletTransactions.customerEmail, `%${input.email}%`)] : [];
        return drizzleDb.select().from(walletTransactions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(walletTransactions.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }),
    // Cancel a pending topup (called when user cancels PayOS payment)
    cancelTopup: publicProcedure
      .input(z.object({ token: z.string(), orderCode: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { customerSessions, walletTransactions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Verify session
        const session = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session[0]) throw new TRPCError({ code: "UNAUTHORIZED" });
        // Find the pending wallet transaction
        const tx = await drizzleDb.select().from(walletTransactions)
          .where(and(
            eq(walletTransactions.payosOrderCode, input.orderCode),
            eq(walletTransactions.customerEmail, session[0].email)
          ))
          .limit(1);
        if (!tx[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy giao dịch" });
        if (tx[0].status !== "pending") {
          // Already processed (paid or failed) - return current status
          return { success: true, status: tx[0].status };
        }
        // Mark as failed (user cancelled)
        await drizzleDb.update(walletTransactions)
          .set({ status: "failed" })
          .where(eq(walletTransactions.id, tx[0].id));
        return { success: true, status: "failed" };
      }),
  }),
  // ─── Banner Routerr ─────────────────────────────────────────────────────────
  banner: router({
    getPublic: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { banners } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.sortOrder);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { banners } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(banners).where(eq(banners.userId, ctx.user.id)).orderBy(banners.sortOrder);
    }),
    create: protectedProcedure
      .input(z.object({ title: z.string().optional(), imageUrl: z.string().url(), linkUrl: z.string().optional(), sortOrder: z.number().default(0) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { banners } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.insert(banners).values({ ...input, userId: ctx.user.id, isActive: true });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), imageUrl: z.string().url().optional(), linkUrl: z.string().optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { banners } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...data } = input;
        await drizzleDb.update(banners).set(data).where(and(eq(banners.id, id), eq(banners.userId, ctx.user.id)));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { banners } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(banners).where(and(eq(banners.id, input.id), eq(banners.userId, ctx.user.id)));
        return { success: true };
      }),
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("banner.jpg"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const fileKey = `banners/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { url };
      }),
  }),
  // ─── Tax Router ────────────────────────────────────────────────────────────
  tax: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { taxSettings } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const result = await drizzleDb.select().from(taxSettings).where(eq(taxSettings.userId, ctx.user.id)).limit(1);
      return result[0] || null;
    }),
    getPublic: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { taxSettings, users } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner[0]) return null;
      const result = await drizzleDb.select().from(taxSettings).where(and(eq(taxSettings.userId, owner[0].id), eq(taxSettings.isEnabled, true))).limit(1);
      return result[0] || null;
    }),
    save: protectedProcedure
      .input(z.object({ taxName: z.string().default("VAT"), taxRate: z.number().min(0).max(100), isEnabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { taxSettings } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await drizzleDb.select().from(taxSettings).where(eq(taxSettings.userId, ctx.user.id)).limit(1);
        if (existing[0]) {
          await drizzleDb.update(taxSettings).set({ taxName: input.taxName, taxRate: input.taxRate.toString(), isEnabled: input.isEnabled }).where(eq(taxSettings.userId, ctx.user.id));
        } else {
          await drizzleDb.insert(taxSettings).values({ userId: ctx.user.id, taxName: input.taxName, taxRate: input.taxRate.toString(), isEnabled: input.isEnabled });
        }
        return { success: true };
      }),
  }),

  // ─── Loyalty Rewards ─────────────────────────────────────────────────────────
  loyaltyRewards: router({
    // Admin: list all rewards
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const { loyaltyRewards } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(loyaltyRewards).where(eq(loyaltyRewards.userId, ctx.user.id)).orderBy(asc(loyaltyRewards.sortOrder));
    }),
    // Public: list active rewards
    getPublic: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { eq, asc, and } = await import("drizzle-orm");
      const { loyaltyRewards } = await import("../drizzle/schema");
      const { users } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner[0]) return [];
      return drizzleDb.select().from(loyaltyRewards).where(and(eq(loyaltyRewards.userId, owner[0].id), eq(loyaltyRewards.isActive, true))).orderBy(asc(loyaltyRewards.sortOrder));
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), imageUrl: z.string().optional(), pointsCost: z.number().min(1), rewardType: z.enum(["discount_code", "wallet_credit", "physical", "custom"]).default("discount_code"), rewardValue: z.number().default(0), stock: z.number().default(-1), isActive: z.boolean().default(true), sortOrder: z.number().default(0) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { loyaltyRewards } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const result = await drizzleDb.insert(loyaltyRewards).values({ ...input, userId: ctx.user.id, rewardValue: input.rewardValue.toString() });
        return { id: (result as any).insertId };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), imageUrl: z.string().optional(), pointsCost: z.number().optional(), rewardType: z.enum(["discount_code", "wallet_credit", "physical", "custom"]).optional(), rewardValue: z.number().optional(), stock: z.number().optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { loyaltyRewards } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, rewardValue, ...rest } = input;
        await drizzleDb.update(loyaltyRewards).set({ ...rest, ...(rewardValue !== undefined ? { rewardValue: rewardValue.toString() } : {}) }).where(and(eq(loyaltyRewards.id, id), eq(loyaltyRewards.userId, ctx.user.id)));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { loyaltyRewards } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(loyaltyRewards).where(and(eq(loyaltyRewards.id, input.id), eq(loyaltyRewards.userId, ctx.user.id)));
        return { success: true };
      }),
    // Customer: redeem a reward
    redeem: publicProcedure
      .input(z.object({ token: z.string(), rewardId: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and, sql } = await import("drizzle-orm");
        const { loyaltyRewards, loyaltyRedemptions, loyaltyPoints, customers, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new TRPCError({ code: "UNAUTHORIZED" });
        const customerEmail = session.email;
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const ownerId = owner[0].id;
        // Get reward
        const reward = await drizzleDb.select().from(loyaltyRewards).where(and(eq(loyaltyRewards.id, input.rewardId), eq(loyaltyRewards.userId, ownerId), eq(loyaltyRewards.isActive, true))).limit(1);
        if (!reward[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Phần thưởng không tồn tại" });
        const rewardItem = reward[0];
        // Check customer points
        const pointRows = await drizzleDb.select({ points: sql<number>`SUM(points)` }).from(loyaltyPoints).where(and(eq(loyaltyPoints.userId, ownerId), eq(loyaltyPoints.customerEmail, customerEmail)));
        const totalPoints = Number(pointRows[0]?.points || 0);
        if (totalPoints < rewardItem.pointsCost) throw new TRPCError({ code: "BAD_REQUEST", message: `Không đủ điểm. Cần ${rewardItem.pointsCost}, bạn có ${totalPoints}` });
        // Check stock
        if (rewardItem.stock !== -1 && (rewardItem.stock ?? 0) <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Phần thưởng đã hết" });
        // Deduct points
        await drizzleDb.insert(loyaltyPoints).values({ userId: ownerId, customerEmail: customerEmail, points: -rewardItem.pointsCost, reason: "REDEEMED" });
        // Update stock
        if (rewardItem.stock !== -1) {
          await drizzleDb.update(loyaltyRewards).set({ stock: (rewardItem.stock ?? 1) - 1 }).where(eq(loyaltyRewards.id, input.rewardId));
        }
        // Create redemption record
        const result = await drizzleDb.insert(loyaltyRedemptions).values({ userId: ownerId, rewardId: input.rewardId, customerEmail: customerEmail, pointsUsed: rewardItem.pointsCost, status: "pending" });
        // If wallet_credit, add to wallet immediately
        if (rewardItem.rewardType === "wallet_credit") {
          const customer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, customerEmail)).limit(1);
          const currentBalance = parseFloat(customer[0]?.walletBalance?.toString() || "0");
          const creditAmount = parseFloat(rewardItem.rewardValue?.toString() || "0");
          await drizzleDb.update(customers).set({ walletBalance: (currentBalance + creditAmount).toString() }).where(eq(customers.email, customerEmail));
          await drizzleDb.update(loyaltyRedemptions).set({ status: "fulfilled" }).where(eq(loyaltyRedemptions.id, (result as any).insertId));
        }
        return { success: true, redemptionId: (result as any).insertId, rewardType: rewardItem.rewardType };
      }),
    // Customer: list own redemptions
    myRedemptions: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and, desc } = await import("drizzle-orm");
        const { loyaltyRedemptions, loyaltyRewards, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) return [];
        return drizzleDb.select({ redemption: loyaltyRedemptions, rewardName: loyaltyRewards.name, rewardType: loyaltyRewards.rewardType }).from(loyaltyRedemptions).leftJoin(loyaltyRewards, eq(loyaltyRedemptions.rewardId, loyaltyRewards.id)).where(and(eq(loyaltyRedemptions.userId, owner[0].id), eq(loyaltyRedemptions.customerEmail, session.email))).orderBy(desc(loyaltyRedemptions.createdAt)).limit(20);
      }),
  }),

  // ─── Spin Wheel ──────────────────────────────────────────────────────────────
  spinWheel: router({
    getConfig: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { spinWheelConfig, spinWheelItems, users } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return null;
      const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner[0]) return null;
      const config = await drizzleDb.select().from(spinWheelConfig).where(eq(spinWheelConfig.userId, owner[0].id)).limit(1);
      const items = await drizzleDb.select().from(spinWheelItems).where(eq(spinWheelItems.userId, owner[0].id));
      return { config: config[0] || null, items };
    }),
    saveConfig: protectedProcedure
      .input(z.object({ isEnabled: z.boolean(), pointsPerSpin: z.number().min(0), spinsPerDay: z.number().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { spinWheelConfig, featureFlags } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await drizzleDb.select().from(spinWheelConfig).where(eq(spinWheelConfig.userId, ctx.user.id)).limit(1);
        if (existing[0]) {
          await drizzleDb.update(spinWheelConfig).set(input).where(eq(spinWheelConfig.userId, ctx.user.id));
        } else {
          await drizzleDb.insert(spinWheelConfig).values({ ...input, userId: ctx.user.id });
        }
        // Sync featureFlags
        const flagKey = "spin_wheel";
        const existingFlag = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.key, flagKey)).limit(1);
        if (existingFlag.length > 0) {
          await drizzleDb.update(featureFlags).set({ enabled: input.isEnabled }).where(eq(featureFlags.key, flagKey));
        } else {
          await drizzleDb.insert(featureFlags).values({ key: flagKey, label: "Vòng quay may mắn", description: "", enabled: input.isEnabled, category: "feature" });
        }
        // Sync userSettings (so Settings page toggle stays in sync)
        const { userSettings } = await import("../drizzle/schema");
        const existingUS = await drizzleDb.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
        if (existingUS.length > 0) {
          await drizzleDb.update(userSettings).set({ featureSpinWheel: input.isEnabled }).where(eq(userSettings.userId, ctx.user.id));
        }
        return { success: true };
      }),
    saveItems: protectedProcedure
      .input(z.array(z.object({ id: z.number().optional(), label: z.string(), prizeType: z.enum(["points", "wallet_credit", "coupon", "nothing"]), prizeValue: z.number().default(0), probability: z.number().min(0).max(100), color: z.string().default("#4F46E5"), isActive: z.boolean().default(true), sortOrder: z.number().default(0) })))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { spinWheelItems } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Delete all and re-insert
        await drizzleDb.delete(spinWheelItems).where(eq(spinWheelItems.userId, ctx.user.id));
        if (input.length > 0) {
          await drizzleDb.insert(spinWheelItems).values(input.map(item => ({ ...item, userId: ctx.user.id, prizeValue: item.prizeValue.toString(), probability: item.probability.toString() })));
        }
        return { success: true };
      }),
    spin: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and, sql, gte } = await import("drizzle-orm");
        const { spinWheelConfig, spinWheelItems, spinHistory, loyaltyPoints, customers, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new TRPCError({ code: "UNAUTHORIZED" });
        const customerEmail = session.email;
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const ownerId = owner[0].id;
        const configRows = await drizzleDb.select().from(spinWheelConfig).where(eq(spinWheelConfig.userId, ownerId)).limit(1);
        const config = configRows[0];
        if (!config?.isEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "Vòng quay chưa được bật" });
        // Check spins today
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const spinsToday = await drizzleDb.select({ count: sql<number>`COUNT(*)` }).from(spinHistory).where(and(eq(spinHistory.userId, ownerId), eq(spinHistory.customerEmail, customerEmail), gte(spinHistory.createdAt, today)));
        if (Number(spinsToday[0]?.count || 0) >= (config.spinsPerDay ?? 1)) throw new TRPCError({ code: "BAD_REQUEST", message: `Bạn đã hết lượt quay hôm nay (${config.spinsPerDay ?? 1} lượt/ngày)` });
        // Check points
        if ((config.pointsPerSpin ?? 0) > 0) {
          const pointRows = await drizzleDb.select({ points: sql<number>`SUM(points)` }).from(loyaltyPoints).where(and(eq(loyaltyPoints.userId, ownerId), eq(loyaltyPoints.customerEmail, customerEmail)));
          const totalPoints = Number(pointRows[0]?.points || 0);
          if (totalPoints < (config.pointsPerSpin ?? 0)) throw new TRPCError({ code: "BAD_REQUEST", message: `Không đủ điểm. Cần ${config.pointsPerSpin ?? 0} điểm để quay` });
        }
        // Get active items
        const items = await drizzleDb.select().from(spinWheelItems).where(and(eq(spinWheelItems.userId, ownerId), eq(spinWheelItems.isActive, true)));
        if (items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Vòng quay chưa có ô nào" });
        // Weighted random selection
        const totalProb = items.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || "0"), 0);
        let rand = Math.random() * totalProb;
        let winner = items[items.length - 1];
        for (const item of items) {
          rand -= parseFloat(item.probability?.toString() || "0");
          if (rand <= 0) { winner = item; break; }
        }
        // Deduct points for spinning
        if ((config.pointsPerSpin ?? 0) > 0) {
          await drizzleDb.insert(loyaltyPoints).values({ userId: ownerId, customerEmail: customerEmail, points: -(config.pointsPerSpin ?? 0), reason: "SPIN_WHEEL" });
        }
        // Apply prize
        const prizeValue = parseFloat(winner.prizeValue?.toString() || "0");
        if (winner.prizeType === "points" && prizeValue > 0) {
          await drizzleDb.insert(loyaltyPoints).values({ userId: ownerId, customerEmail: customerEmail, points: Math.round(prizeValue), reason: "SPIN_WHEEL_WIN" });
        } else if (winner.prizeType === "wallet_credit" && prizeValue > 0) {
          const customer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, customerEmail)).limit(1);
          const currentBalance = parseFloat(customer[0]?.walletBalance?.toString() || "0");
          await drizzleDb.update(customers).set({ walletBalance: (currentBalance + prizeValue).toString() }).where(eq(customers.email, customerEmail));
        }
        // Record spin history
        await drizzleDb.insert(spinHistory).values({ userId: ownerId, customerEmail: customerEmail, spinWheelItemId: winner.id, prizeType: winner.prizeType, prizeValue: winner.prizeValue, pointsUsed: config.pointsPerSpin ?? 0 });
        return { success: true, winner: { label: winner.label, prizeType: winner.prizeType, prizeValue } };
      }),
    myHistory: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and, desc } = await import("drizzle-orm");
        const { spinHistory, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) return [];
        return drizzleDb.select().from(spinHistory).where(and(eq(spinHistory.userId, owner[0].id), eq(spinHistory.customerEmail, session.email))).orderBy(desc(spinHistory.createdAt)).limit(20);
      }),
  }),

  // ─── Referral Withdrawals ─────────────────────────────────────────────────────
  referralWithdrawals: router({
    // Customer: request withdrawal
    create: publicProcedure
      .input(z.object({ token: z.string(), customerName: z.string().optional(), amount: z.number().min(1), withdrawType: z.enum(["atm", "wallet"]), bankName: z.string().optional(), bankAccount: z.string().optional(), bankHolder: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { referralWithdrawals, customerReferralCodes, customers, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) throw new TRPCError({ code: "UNAUTHORIZED" });
        const customerEmail = session.email;
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) throw new TRPCError({ code: "NOT_FOUND" });
        const ownerId = owner[0].id;
        // Check referral balance
        const referralCode = await drizzleDb.select().from(customerReferralCodes).where(eq(customerReferralCodes.email, customerEmail)).limit(1);
        const totalRewards = parseFloat(referralCode[0]?.totalRewards?.toString() || "0");
        if (totalRewards < input.amount) throw new TRPCError({ code: "BAD_REQUEST", message: `Số dư hoa hồng không đủ. Bạn có ${totalRewards.toLocaleString("vi-VN")}₫` });
        if (input.withdrawType === "atm" && (!input.bankName || !input.bankAccount || !input.bankHolder)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Vui lòng nhập đầy đủ thông tin ngân hàng" });
        }
        // If wallet, credit immediately
        if (input.withdrawType === "wallet") {
          const customer = await drizzleDb.select({ walletBalance: customers.walletBalance }).from(customers).where(eq(customers.email, customerEmail)).limit(1);
          const currentBalance = parseFloat(customer[0]?.walletBalance?.toString() || "0");
          await drizzleDb.update(customers).set({ walletBalance: (currentBalance + input.amount).toString() }).where(eq(customers.email, customerEmail));
          // Deduct from referral balance
          await drizzleDb.update(customerReferralCodes).set({ totalRewards: (totalRewards - input.amount).toString() }).where(eq(customerReferralCodes.email, customerEmail));
        }
        const result = await drizzleDb.insert(referralWithdrawals).values({ userId: ownerId, customerEmail: customerEmail, customerName: input.customerName, amount: input.amount.toString(), withdrawType: input.withdrawType, bankName: input.bankName, bankAccount: input.bankAccount, bankHolder: input.bankHolder, status: input.withdrawType === "wallet" ? "completed" : "pending" });
        return { success: true, id: (result as any).insertId, status: input.withdrawType === "wallet" ? "completed" : "pending" };
      }),
    // Customer: list own withdrawals
    myList: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { eq, and, desc } = await import("drizzle-orm");
        const { referralWithdrawals, users, customerSessions } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return [];
        const owner = await drizzleDb.select({ id: users.id }).from(users).limit(1);
        if (!owner[0]) return [];
        return drizzleDb.select().from(referralWithdrawals).where(and(eq(referralWithdrawals.userId, owner[0].id), eq(referralWithdrawals.customerEmail, session.email))).orderBy(desc(referralWithdrawals.createdAt)).limit(20);
      }),
    // Admin: list all withdrawals
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const { referralWithdrawals } = await import("../drizzle/schema");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(referralWithdrawals).where(eq(referralWithdrawals.userId, ctx.user.id)).orderBy(desc(referralWithdrawals.createdAt));
    }),
    // Admin: update status
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "processing", "completed", "rejected"]), adminNote: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const { referralWithdrawals } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.update(referralWithdrawals).set({ status: input.status, adminNote: input.adminNote }).where(and(eq(referralWithdrawals.id, input.id), eq(referralWithdrawals.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
  // ─── Customer Notifications ──────────────────────────────────────────────────
  customerNotif: router({
    list: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { customerSessions, customerNotifications } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { items: [], unreadCount: 0 };
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || session.expiresAt < new Date()) return { items: [], unreadCount: 0 };
      const items = await drizzleDb.select().from(customerNotifications)
        .where(eq(customerNotifications.customerEmail, session.email))
        .orderBy(desc(customerNotifications.createdAt)).limit(30);
      const unreadCount = items.filter(n => !n.isRead).length;
      return { items, unreadCount };
    }),
    markAllRead: publicProcedure.input(z.object({ token: z.string() })).mutation(async ({ input }) => {
      const { customerSessions, customerNotifications } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { success: false };
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || session.expiresAt < new Date()) return { success: false };
      await drizzleDb.update(customerNotifications).set({ isRead: true }).where(eq(customerNotifications.customerEmail, session.email));
      return { success: true };
    }),
    markRead: publicProcedure.input(z.object({ token: z.string(), id: z.number() })).mutation(async ({ input }) => {
      const { customerNotifications } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { success: false };
      await drizzleDb.update(customerNotifications).set({ isRead: true }).where(eq(customerNotifications.id, input.id));
      return { success: true };
    }),
    // Admin: create notification for a customer (uses customer token for admin session)
    create: publicProcedure.input(z.object({
      token: z.string(),
      customerEmail: z.string().email(),
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.enum(["info", "success", "warning", "order", "payment", "promo"]).optional(),
      link: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { customerNotifications, customerSessions, users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify admin session
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || !session.isAdminSession) throw new TRPCError({ code: "UNAUTHORIZED" });
      const [owner] = await drizzleDb.select().from(users).limit(1);
      if (!owner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzleDb.insert(customerNotifications).values({
        userId: owner.id,
        customerEmail: input.customerEmail,
        title: input.title,
        message: input.message,
        type: input.type || "info",
        link: input.link || null,
      });
      return { success: true };
    }),
    // Admin: broadcast notification to all customers
    broadcast: publicProcedure.input(z.object({
      token: z.string(),
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.enum(["info", "success", "warning", "order", "payment", "promo"]).optional(),
      link: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { customerNotifications, customerSessions, users, customers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || !session.isAdminSession) throw new TRPCError({ code: "UNAUTHORIZED" });
      const [owner] = await drizzleDb.select().from(users).limit(1);
      if (!owner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const allCustomers = await drizzleDb.select({ email: customers.email }).from(customers);
      if (allCustomers.length === 0) return { success: true, count: 0 };
      await drizzleDb.insert(customerNotifications).values(
        allCustomers.filter(c => c.email != null).map(c => ({
          userId: owner.id,
          customerEmail: c.email as string,
          title: input.title,
          message: input.message,
          type: input.type || "info",
          link: input.link || null,
        }))
      );
      return { success: true, count: allCustomers.length };
    }),
  }),
  // ─── Support Tickets ─────────────────────────────────────────────────────────
  support: router({
    createTicket: publicProcedure.input(z.object({
      token: z.string().optional(),
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
      subject: z.string().min(1).max(200),
      message: z.string().min(1),
      priority: z.enum(["low", "medium", "high"]).optional(),
    })).mutation(async ({ input }) => {
      const { supportTickets } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await drizzleDb.insert(supportTickets).values({
        userId: 1,
        customerEmail: input.customerEmail,
        customerName: input.customerName || null,
        subject: input.subject,
        message: input.message,
        priority: (input.priority || "medium") as any,
        status: "open" as any,
      });
      return { success: true, ticketId: (result as any).insertId };
    }),
    listMyTickets: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { customerSessions, supportTickets } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
      if (!session || session.expiresAt < new Date()) return [];
      return drizzleDb.select().from(supportTickets).where(eq(supportTickets.customerEmail, session.email)).orderBy(desc(supportTickets.createdAt)).limit(20);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { supportTickets } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(supportTickets).where(eq(supportTickets.userId, ctx.user.id)).orderBy(desc(supportTickets.createdAt));
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
      adminReply: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { supportTickets, customers } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Get ticket info before update (for email)
      const [ticket] = await drizzleDb.select().from(supportTickets).where(and(eq(supportTickets.id, input.id), eq(supportTickets.userId, ctx.user.id))).limit(1);
      await drizzleDb.update(supportTickets).set({
        status: input.status as any,
        adminReply: input.adminReply || null,
        repliedAt: input.adminReply ? new Date() : undefined,
      }).where(and(eq(supportTickets.id, input.id), eq(supportTickets.userId, ctx.user.id)));
      // Send email notification if admin replied
      if (input.adminReply && ticket && ticket.customerEmail) {
        try {
          // Check if customer has email notifications enabled
          const [customer] = await drizzleDb.select({ notifyOrderStatus: customers.notifyOrderStatus, name: customers.name })
            .from(customers)
            .where(and(eq(customers.userId, ctx.user.id), eq(customers.email, ticket.customerEmail)))
            .limit(1);
          const shouldNotify = !customer || customer.notifyOrderStatus !== false;
          if (shouldNotify) {
            const { sendEmail } = await import("./email");
            const statusLabels: Record<string, string> = { open: "Mới mở", in_progress: "Đang xử lý", resolved: "Đã giải quyết", closed: "Đóng" };
            const html = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#3b82f6;">Phản hồi ticket hỗ trợ #${ticket.id}</h2>
                <p>Xin chào ${ticket.customerName || ticket.customerEmail},</p>
                <p>Ticket hỗ trợ của bạn đã được phản hồi.</p>
                <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
                  <p style="margin:0 0 8px;"><strong>Tiêu đề:</strong> ${ticket.subject}</p>
                  <p style="margin:0 0 8px;"><strong>Trạng thái:</strong> ${statusLabels[input.status] || input.status}</p>
                </div>
                <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;padding:16px;margin:16px 0;">
                  <p style="margin:0 0 8px;"><strong>Phản hồi từ hỗ trợ:</strong></p>
                  <p style="margin:0;white-space:pre-wrap;">${input.adminReply}</p>
                </div>
                <p style="color:#6b7280;font-size:12px;">Bạn có thể xem lịch sử ticket trong trang tài khoản của mình.</p>
              </div>
            `;
            await sendEmail({ to: ticket.customerEmail, subject: `[Hỗ trợ] Phản hồi ticket #${ticket.id}: ${ticket.subject}`, html, userId: ctx.user.id });
          }
        } catch (e) {
          // Email failure should not block the update
          console.error("Failed to send ticket reply email:", e);
        }
      }
      return { success: true };
    }),
  }),
  // ─── Product Tags ─────────────────────────────────────────────────────────────
  productTags: router({
    // Admin: list all tags
    list: protectedProcedure.query(async ({ ctx }) => {
      const { productTags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(productTags).where(eq(productTags.userId, ctx.user.id));
    }),
    // Public: list all tags (for product display)
    listPublic: publicProcedure.query(async () => {
      const { productTags, users } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (!owner) return [];
      const { eq } = await import("drizzle-orm");
      return drizzleDb.select().from(productTags).where(eq(productTags.userId, owner.id));
    }),
    // Admin: create tag
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(100).optional(),
      color: z.string().optional(),
      icon: z.string().max(50).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { productTags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");
      const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [result] = await drizzleDb.insert(productTags).values({
        userId: ctx.user.id,
        name: input.name,
        slug,
        color: input.color || "#3b82f6",
        icon: input.icon || null,
      } as any);
      return { id: (result as any).insertId, name: input.name, slug, color: input.color || "#3b82f6", icon: input.icon || null };
    }),
    // Admin: update tag
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      color: z.string().optional(),
      icon: z.string().max(50).optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      const { productTags } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.color) updates.color = input.color;
      if (input.icon !== undefined) updates.icon = input.icon;
      await drizzleDb.update(productTags).set(updates).where(and(eq(productTags.id, input.id), eq(productTags.userId, ctx.user.id)));
      return { success: true };
    }),
    // Admin: delete tag
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { productTags, productTagMappings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");
      await drizzleDb.delete(productTagMappings).where(eq(productTagMappings.tagId, input.id));
      await drizzleDb.delete(productTags).where(and(eq(productTags.id, input.id), eq(productTags.userId, ctx.user.id)));
      return { success: true };
    }),
    // Admin: assign tags to product
    assignToProduct: protectedProcedure.input(z.object({
      productId: z.number(),
      tagIds: z.array(z.number()),
    })).mutation(async ({ ctx, input }) => {
      const { productTagMappings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");
      // Remove existing mappings
      await drizzleDb.delete(productTagMappings).where(eq(productTagMappings.productId, input.productId));
      // Insert new mappings
      if (input.tagIds.length > 0) {
        await drizzleDb.insert(productTagMappings).values(input.tagIds.map(tagId => ({ productId: input.productId, tagId })));
      }
      return { success: true };
    }),
    // Public: get tags for a product
    getForProduct: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      const { productTags, productTagMappings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const mappings = await drizzleDb.select({ tagId: productTagMappings.tagId }).from(productTagMappings).where(eq(productTagMappings.productId, input.productId));
      if (mappings.length === 0) return [];
      const tagIds = mappings.map(m => m.tagId);
      const { inArray } = await import("drizzle-orm");
      return drizzleDb.select().from(productTags).where(inArray(productTags.id, tagIds));
    }),
    // Public: get tags for multiple products
    getForProducts: publicProcedure.input(z.object({ productIds: z.array(z.number()) })).query(async ({ input }) => {
      const { productTags, productTagMappings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { inArray } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb || input.productIds.length === 0) return [];
      const mappings = await drizzleDb.select().from(productTagMappings).where(inArray(productTagMappings.productId, input.productIds));
      if (mappings.length === 0) return [];
      const tagIds = Array.from(new Set(mappings.map(m => m.tagId)));
      const tags = await drizzleDb.select().from(productTags).where(inArray(productTags.id, tagIds));
      return mappings.map(m => ({ productId: m.productId, tag: tags.find(t => t.id === m.tagId) })).filter(m => m.tag);
    }),
  }),
  announcement: router({
    listPublic: publicProcedure.query(async () => {
      const { siteAnnouncements } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { and, eq, or, isNull, lte, gte } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const now = new Date();
      const rows = await drizzleDb.select().from(siteAnnouncements)
        .where(and(
          eq(siteAnnouncements.isActive, true),
          lte(siteAnnouncements.startAt, now),
          or(isNull(siteAnnouncements.endAt), gte(siteAnnouncements.endAt, now))
        ));
      return rows;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { siteAnnouncements } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(siteAnnouncements).where(eq(siteAnnouncements.userId, ctx.user.id)).orderBy(desc(siteAnnouncements.createdAt));
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      type: z.enum(["info", "success", "warning", "error"]).default("info"),
      isActive: z.boolean().default(true),
      showAsPopup: z.boolean().default(false),
      targetPages: z.string().optional(),
      startAt: z.date().optional(),
      endAt: z.date().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { siteAnnouncements } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(siteAnnouncements).values({ ...input, userId: ctx.user.id, startAt: input.startAt || new Date() } as any);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      type: z.enum(["info", "success", "warning", "error"]).optional(),
      isActive: z.boolean().optional(),
      showAsPopup: z.boolean().optional(),
      targetPages: z.string().optional(),
      startAt: z.date().optional(),
      endAt: z.date().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { siteAnnouncements } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { and, eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await drizzleDb.update(siteAnnouncements).set(data as any).where(and(eq(siteAnnouncements.id, id), eq(siteAnnouncements.userId, ctx.user.id)));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { siteAnnouncements } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { and, eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(siteAnnouncements).where(and(eq(siteAnnouncements.id, input.id), eq(siteAnnouncements.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  // ─── Blog ──────────────────────────────────────────────────────────────────────────────────────
  blog: router({
    // Public: list published posts
    listPosts: publicProcedure
      .input(z.object({ categoryId: z.number().optional(), page: z.number().default(1), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const { blogPosts, blogCategories } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, desc, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { posts: [], total: 0 };
        const conditions = [eq(blogPosts.isPublished, true)];
        if (input.categoryId) conditions.push(eq(blogPosts.categoryId, input.categoryId));
        const offset = (input.page - 1) * input.limit;
        const posts = await drizzleDb.select({
          id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug,
          excerpt: blogPosts.excerpt, coverImage: blogPosts.coverImage,
          publishedAt: blogPosts.publishedAt, viewCount: blogPosts.viewCount,
          categoryId: blogPosts.categoryId,
        }).from(blogPosts).where(and(...conditions)).orderBy(desc(blogPosts.publishedAt)).limit(input.limit).offset(offset);
        return { posts };
      }),
    // Public: get single post by slug
    getPost: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { blogPosts, blogCategories } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const [post] = await drizzleDb.select().from(blogPosts).where(eq(blogPosts.slug, input.slug)).limit(1);
        if (!post || !post.isPublished) return null;
        // Increment view count
        await drizzleDb.update(blogPosts).set({ viewCount: (post.viewCount || 0) + 1 }).where(eq(blogPosts.id, post.id));
        return post;
      }),
    // Public: list categories
    listCategories: publicProcedure.query(async () => {
      const { blogCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder));
    }),
    // Admin: create post
    createPost: protectedProcedure
      .input(z.object({
        title: z.string().min(1), slug: z.string().min(1), content: z.string().min(1),
        excerpt: z.string().optional(), coverImage: z.string().optional(),
        categoryId: z.number().optional(), isPublished: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const { blogPosts } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [post] = await drizzleDb.insert(blogPosts).values({
          userId: ctx.user.id, title: input.title, slug: input.slug,
          content: input.content, excerpt: input.excerpt, coverImage: input.coverImage,
          categoryId: input.categoryId, isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : undefined,
        }).$returningId();
        return { id: post.id };
      }),
    // Admin: update post
    updatePost: protectedProcedure
      .input(z.object({
        id: z.number(), title: z.string().optional(), slug: z.string().optional(),
        content: z.string().optional(), excerpt: z.string().optional(),
        coverImage: z.string().optional(), categoryId: z.number().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { blogPosts } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const updateData: any = { updatedAt: new Date() };
        if (input.title !== undefined) updateData.title = input.title;
        if (input.slug !== undefined) updateData.slug = input.slug;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
        if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
        if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
        if (input.isPublished !== undefined) {
          updateData.isPublished = input.isPublished;
          if (input.isPublished) updateData.publishedAt = new Date();
        }
        await drizzleDb.update(blogPosts).set(updateData).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),
    // Admin: delete post
    deletePost: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { blogPosts } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(blogPosts).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),
    // Admin: list all posts (including unpublished)
    adminGetPost: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { blogPosts } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const [post] = await drizzleDb.select().from(blogPosts).where(eq(blogPosts.id, input.id)).limit(1);
        return post || null;
      }),
    adminListPosts: protectedProcedure.query(async ({ ctx }) => {
      const { blogPosts, blogCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc, eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(blogPosts).where(eq(blogPosts.userId, ctx.user.id)).orderBy(desc(blogPosts.createdAt));
    }),
    // Admin: create category
    createCategory: protectedProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), sortOrder: z.number().default(0) }))
      .mutation(async ({ input, ctx }) => {
        const { blogCategories } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [cat] = await drizzleDb.insert(blogCategories).values({ userId: ctx.user.id, name: input.name, slug: input.slug, sortOrder: input.sortOrder }).$returningId();
        return { id: cat.id };
      }),
    // Admin: delete category
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { blogCategories } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(blogCategories).where(eq(blogCategories.id, input.id));
        return { success: true };
      }),
  }),
  // ─── Avatar Images Router ──────────────────────────────────────────────────
  avatarImages: router({
    // Public: get all active avatars (respects featureAvatarGallery toggle)
    getAll: publicProcedure.query(async () => {
      const { avatarImages, userSettings } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Check if feature is enabled
      const settingsRows = await drizzleDb.select().from(userSettings).limit(1);
      const settings = settingsRows[0] as any;
      if (settings && settings.featureAvatarGallery === false) return [];
      return drizzleDb.select().from(avatarImages)
        .where(eq(avatarImages.isActive, true))
        .orderBy(asc(avatarImages.sortOrder), asc(avatarImages.id));
    }),
    // Admin: get all avatars (including inactive)
    adminGetAll: protectedProcedure.query(async ({ ctx }) => {
      const { avatarImages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(avatarImages)
        .where(eq(avatarImages.userId, ctx.user.id))
        .orderBy(asc(avatarImages.sortOrder), asc(avatarImages.id));
    }),
    // Admin: upload image to gallery (base64)
    uploadToGallery: protectedProcedure
      .input(z.object({
        dataUrl: z.string(),
        label: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { avatarImages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { storagePut } = await import("./storage");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const matches = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid data URL format");
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const fileKey = `avatar-gallery/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        const [row] = await drizzleDb.insert(avatarImages).values({
          userId: ctx.user.id,
          url,
          fileKey,
          label: input.label || null,
          category: input.category || "default",
          sortOrder: 0,
          isActive: true,
        }).$returningId();
        return { id: row.id, url };
      }),
    // Admin: add avatar
    add: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        fileKey: z.string(),
        label: z.string().optional(),
        category: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const { avatarImages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [row] = await drizzleDb.insert(avatarImages).values({
          userId: ctx.user.id,
          url: input.url,
          fileKey: input.fileKey,
          label: input.label || null,
          category: input.category || "default",
          sortOrder: input.sortOrder,
          isActive: true,
        }).$returningId();
        return { id: row.id };
      }),
    // Admin: toggle active
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const { avatarImages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.update(avatarImages).set({ isActive: input.isActive }).where(eq(avatarImages.id, input.id));
        return { success: true };
      }),
    // Admin: delete avatar
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { avatarImages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(avatarImages).where(eq(avatarImages.id, input.id));
        return { success: true };
      }),
    // Customer: update avatar (choose from library or upload)
    updateCustomerAvatar: publicProcedure
      .input(z.object({
        token: z.string(),
        avatarUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const { customerSessions, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [session] = await drizzleDb.select().from(customerSessions).where(eq(customerSessions.token, input.token)).limit(1);
        if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
        await drizzleDb.update(customers).set({ avatarUrl: input.avatarUrl } as any).where(eq(customers.email, session.email));
        return { success: true };
      }),
  }),

  // ── Automations Router ──
  automation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { automations } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(automations).where(eq(automations.userId, ctx.user.id));
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        jobType: z.string().min(1),
        intervalSeconds: z.number().int().positive(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { automations } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const nextRun = new Date(Date.now() + input.intervalSeconds * 1000);
        await drizzleDb.insert(automations).values({
          userId: ctx.user.id,
          name: input.name,
          jobType: input.jobType,
          intervalSeconds: input.intervalSeconds,
          isActive: true,
          nextRunAt: nextRun,
        } as any);
        return { success: true };
      }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const { automations } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.update(automations)
          .set({ isActive: input.isActive } as any)
          .where(and(eq(automations.id, input.id), eq(automations.userId, ctx.user.id)));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { automations } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(automations).where(and(eq(automations.id, input.id), eq(automations.userId, ctx.user.id)));
        return { success: true };
      }),
    runNow: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { automations } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [auto] = await drizzleDb.select().from(automations)
          .where(and(eq(automations.id, input.id), eq(automations.userId, ctx.user.id))).limit(1);
        if (!auto) throw new TRPCError({ code: "NOT_FOUND" });
        // Update lastRunAt, runCount, nextRunAt
        const nextRun = new Date(Date.now() + auto.intervalSeconds * 1000);
        await drizzleDb.update(automations).set({
          lastRunAt: new Date(),
          runCount: (auto.runCount ?? 0) + 1,
          nextRunAt: nextRun,
        } as any).where(eq(automations.id, input.id));
        return { success: true, jobType: auto.jobType };
      }),
  }),

  // ── Block IP Router ──
  blockIp: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { blockedIps } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(blockedIps)
        .where(eq(blockedIps.userId, ctx.user.id))
        .orderBy(desc(blockedIps.blockedAt));
    }),
    add: protectedProcedure
      .input(z.object({
        ipAddress: z.string().min(1),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { blockedIps } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.insert(blockedIps).values({
          userId: ctx.user.id,
          ipAddress: input.ipAddress,
          reason: input.reason ?? null,
          isActive: true,
        } as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { blockedIps } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(blockedIps).where(and(eq(blockedIps.id, input.id), eq(blockedIps.userId, ctx.user.id)));
        return { success: true };
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        const { blockedIps } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { inArray, and, eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(blockedIps).where(and(inArray(blockedIps.id, input.ids), eq(blockedIps.userId, ctx.user.id)));
        return { success: true };
      }),
    cleanup: protectedProcedure.mutation(async ({ ctx }) => {
      const { blockedIps } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and, lt } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const now = new Date();
      const result = await drizzleDb.delete(blockedIps)
        .where(and(eq(blockedIps.userId, ctx.user.id), lt(blockedIps.expiresAt, now)));
      return { deleted: (result as any).affectedRows ?? 0 };
    }),
  }),
  // ── Email Campaign Router ──
  emailCampaign: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { emailCampaigns } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(emailCampaigns)
        .where(eq(emailCampaigns.userId, ctx.user.id))
        .orderBy(desc(emailCampaigns.createdAt));
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        targetType: z.enum(["ALL", "PAID", "UNPAID", "CUSTOM"]).default("ALL"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { emailCampaigns } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.insert(emailCampaigns).values({
          userId: ctx.user.id,
          name: input.name,
          subject: input.subject,
          htmlBody: input.htmlBody,
          targetType: input.targetType,
          status: "DRAFT",
          totalRecipients: 0,
          sentCount: 0,
          failedCount: 0,
        });
        return { success: true };
      }),
    send: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { emailCampaigns, customers } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        const [campaign] = await drizzleDb.select().from(emailCampaigns)
          .where(and(eq(emailCampaigns.id, input.id), eq(emailCampaigns.userId, ctx.user.id))).limit(1);
        if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
        // Get recipients
        const allCustomers = await drizzleDb.select({ email: customers.email, name: customers.name })
          .from(customers).where(eq(customers.userId, ctx.user.id));
        let sent = 0;
        for (const customer of allCustomers) {
          try {
            const html = campaign.htmlBody.replace(/\{\{name\}\}/g, customer.name ?? "Qu\u00fd kh\u00e1ch");
            await sendEmail({
              to: customer.email as string,
              subject: campaign.subject,
              html,
              userId: ctx.user.id,
            });
            sent++;
          } catch {}
        }
        await drizzleDb.update(emailCampaigns).set({
          status: "SENT",
          sentCount: sent,
          totalRecipients: allCustomers.length,
          sentAt: new Date(),
        }).where(eq(emailCampaigns.id, input.id));
        return { sent, total: allCustomers.length };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { emailCampaigns } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(emailCampaigns).where(and(eq(emailCampaigns.id, input.id), eq(emailCampaigns.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  imageLibrary: router({
    getFolders: protectedProcedure.query(async ({ ctx }) => {
      const { imageFolders } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(imageFolders).where(eq(imageFolders.userId, ctx.user.id));
    }),
    createFolder: protectedProcedure
      .input(z.object({ name: z.string().min(1), parentId: z.number().nullable() }))
      .mutation(async ({ input, ctx }) => {
        const { imageFolders } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.insert(imageFolders).values({ name: input.name, parentId: input.parentId ?? undefined, userId: ctx.user.id });
        return { success: true };
      }),
    deleteFolder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { imageFolders, imageFiles } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(imageFiles).where(and(eq(imageFiles.folderId, input.id), eq(imageFiles.userId, ctx.user.id)));
        await drizzleDb.delete(imageFolders).where(and(eq(imageFolders.id, input.id), eq(imageFolders.userId, ctx.user.id)));
        return { success: true };
      }),
    getImages: protectedProcedure
      .input(z.object({ folderId: z.number().nullable() }))
      .query(async ({ input, ctx }) => {
        const { imageFiles } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, isNull } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        if (input.folderId === null) {
          return drizzleDb.select().from(imageFiles).where(eq(imageFiles.userId, ctx.user.id));
        }
        return drizzleDb.select().from(imageFiles).where(and(eq(imageFiles.userId, ctx.user.id), eq(imageFiles.folderId, input.folderId)));
      }),
    uploadImage: protectedProcedure
      .input(z.object({
        folderId: z.number().nullable(),
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { imageFiles } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { storagePut } = await import("./storage");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        // Convert base64 to buffer
        const base64 = input.base64Data.split(",")[1] || input.base64Data;
        const buffer = Buffer.from(base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const fileKey = `images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        await drizzleDb.insert(imageFiles).values({
          userId: ctx.user.id,
          folderId: input.folderId ?? undefined,
          filename: fileKey,
          originalName: input.filename,
          url,
          fileKey,
          mimeType: input.mimeType,
          size: input.size,
        });
        return { url };
      }),
    deleteImages: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        const { imageFiles } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, inArray } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("DB unavailable");
        await drizzleDb.delete(imageFiles).where(and(eq(imageFiles.userId, ctx.user.id), inArray(imageFiles.id, input.ids)));
        return { success: true };
      }),
  }),

  // ─── Static Pages ─────────────────────────────────────────────────────────
  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { staticPages } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(staticPages).orderBy(desc(staticPages.createdAt));
    }),
    create: protectedProcedure
      .input(z.object({ title: z.string().min(1), slug: z.string().min(1), content: z.string().default("") }))
      .mutation(async ({ input }) => {
        const { staticPages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [page] = await drizzleDb.insert(staticPages).values({ title: input.title, slug: input.slug, content: input.content, isPublished: 0 }).$returningId();
        return page;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).optional(), slug: z.string().min(1).optional(), content: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { staticPages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...data } = input;
        await drizzleDb.update(staticPages).set(data).where(eq(staticPages.id, id));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { staticPages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(staticPages).where(eq(staticPages.id, input.id));
        return { success: true };
      }),
    togglePublish: protectedProcedure
      .input(z.object({ id: z.number(), isPublished: z.boolean() }))
      .mutation(async ({ input }) => {
        const { staticPages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.update(staticPages).set({ isPublished: input.isPublished ? 1 : 0 }).where(eq(staticPages.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Menu Manager ─────────────────────────────────────────────────────────
  menu: router({
    list: protectedProcedure.query(async () => {
      const { menuItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(menuItems).orderBy(asc(menuItems.order));
    }),
    create: protectedProcedure
      .input(z.object({ label: z.string().min(1), url: z.string().min(1), target: z.enum(["_self", "_blank"]).default("_self") }))
      .mutation(async ({ input }) => {
        const { menuItems } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const allItems = await drizzleDb.select().from(menuItems);
        const maxOrder = allItems.length > 0 ? Math.max(...allItems.map((i: any) => i.order)) : -1;
        const [item] = await drizzleDb.insert(menuItems).values({ label: input.label, url: input.url, target: input.target, order: maxOrder + 1, isActive: 1 }).$returningId();
        return item;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), label: z.string().min(1).optional(), url: z.string().min(1).optional(), target: z.enum(["_self", "_blank"]).optional() }))
      .mutation(async ({ input }) => {
        const { menuItems } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...data } = input;
        await drizzleDb.update(menuItems).set(data).where(eq(menuItems.id, id));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { menuItems } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(menuItems).where(eq(menuItems.id, input.id));
        return { success: true };
      }),
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const { menuItems } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.update(menuItems).set({ isActive: input.isActive ? 1 : 0 }).where(eq(menuItems.id, input.id));
        return { success: true };
      }),
    reorder: protectedProcedure
      .input(z.object({ id: z.number(), direction: z.enum(["up", "down"]) }))
      .mutation(async ({ input }) => {
        const { menuItems } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, asc } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const allItems = await drizzleDb.select().from(menuItems).orderBy(asc(menuItems.order));
        const idx = allItems.findIndex((i: any) => i.id === input.id);
        if (idx < 0) throw new TRPCError({ code: "NOT_FOUND" });
        const swapIdx = input.direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= allItems.length) return { success: true };
        const a = allItems[idx] as any;
        const b = allItems[swapIdx] as any;
        await drizzleDb.update(menuItems).set({ order: b.order }).where(eq(menuItems.id, a.id));
        await drizzleDb.update(menuItems).set({ order: a.order }).where(eq(menuItems.id, b.id));
        return { success: true };
      }),
    publicList: publicProcedure.query(async () => {
      const { menuItems } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, asc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(menuItems).where(eq(menuItems.isActive, 1)).orderBy(asc(menuItems.order));
    }),
  }),

  // ─── Product Inventory ────────────────────────────────────────────────────
  inventory: router({
    list: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        packageId: z.number().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        const { productInventory, products, productPackages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, desc, like, count, sql } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { items: [], total: 0 };
        const conditions: any[] = [];
        if (input.productId) conditions.push(eq(productInventory.productId, input.productId));
        if (input.packageId) conditions.push(eq(productInventory.packageId, input.packageId));
        if (input.status) conditions.push(eq(productInventory.status, input.status as any));
        if (input.search) conditions.push(like(productInventory.stockData, `%${input.search}%`));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (input.page - 1) * input.limit;
        // Get total count
        const [{ total }] = await drizzleDb.select({ total: count() }).from(productInventory).where(where);
        // Get items with product/package names via join
        const rows = await drizzleDb
          .select({
            id: productInventory.id,
            productId: productInventory.productId,
            packageId: productInventory.packageId,
            stockData: productInventory.stockData,
            status: productInventory.status,
            assignedOrderId: productInventory.assignedOrderId,
            assignedAt: productInventory.assignedAt,
            createdAt: productInventory.createdAt,
            productName: products.name,
            packageName: productPackages.name,
          })
          .from(productInventory)
          .leftJoin(products, eq(productInventory.productId, products.id))
          .leftJoin(productPackages, eq(productInventory.packageId, productPackages.id))
          .where(where)
          .orderBy(desc(productInventory.createdAt))
          .limit(input.limit)
          .offset(offset);
        return { items: rows, total: Number(total) };
      }),
    stats: protectedProcedure.query(async () => {
      const { productInventory } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, count } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { total: 0, available: 0, used: 0, reserved: 0 };
      const [totalRow] = await drizzleDb.select({ c: count() }).from(productInventory);
      const [availRow] = await drizzleDb.select({ c: count() }).from(productInventory).where(eq(productInventory.status, "available"));
      const [usedRow] = await drizzleDb.select({ c: count() }).from(productInventory).where(eq(productInventory.status, "used"));
      const [resRow] = await drizzleDb.select({ c: count() }).from(productInventory).where(eq(productInventory.status, "reserved"));
      return {
        total: Number(totalRow?.c ?? 0),
        available: Number(availRow?.c ?? 0),
        used: Number(usedRow?.c ?? 0),
        reserved: Number(resRow?.c ?? 0),
      };
    }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["available", "used", "reserved"]) }))
      .mutation(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.update(productInventory).set({ status: input.status }).where(eq(productInventory.id, input.id));
        return { success: true };
      }),
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()).min(1) }))
      .mutation(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { inArray } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(productInventory).where(inArray(productInventory.id, input.ids));
        return { deleted: input.ids.length };
      }),
    updateStockData: protectedProcedure
      .input(z.object({ id: z.number(), stockData: z.string() }))
      .mutation(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.update(productInventory).set({ stockData: input.stockData }).where(eq(productInventory.id, input.id));
        return { success: true };
      }),
    add: protectedProcedure
      .input(z.object({ packageId: z.number(), items: z.array(z.string()).min(1) }))
      .mutation(async ({ input }) => {
        const { productInventory, productPackages } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, sql } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Lookup productId and package info
        const [pkg] = await drizzleDb.select({ productId: productPackages.productId, name: productPackages.name, minStockThreshold: productPackages.minStockThreshold }).from(productPackages).where(eq(productPackages.id, input.packageId));
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Gói sản phẩm không tồn tại" });
        const rows = input.items.map(item => ({
          productId: pkg.productId,
          packageId: input.packageId,
          stockData: item,
          status: "available" as const,
        }));
        await drizzleDb.insert(productInventory).values(rows as any);
        return { added: rows.length };
      }),
    checkLowStock: protectedProcedure
      .input(z.object({ packageId: z.number() }))
      .mutation(async ({ input }) => {
        // Called after an order is fulfilled to check if stock dropped below threshold
        const { productInventory, productPackages, products } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, sql } = await import("drizzle-orm");
        const { notifyOwner } = await import("./_core/notification");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { notified: false };
        const [pkg] = await drizzleDb
          .select({ id: productPackages.id, name: productPackages.name, productId: productPackages.productId, minStockThreshold: productPackages.minStockThreshold })
          .from(productPackages).where(eq(productPackages.id, input.packageId));
        if (!pkg) return { notified: false };
        const threshold = pkg.minStockThreshold ?? 5;
        const [countRow] = await drizzleDb
          .select({ cnt: sql<number>`COUNT(*)` })
          .from(productInventory)
          .where(and(eq(productInventory.packageId, input.packageId), eq(productInventory.status, "available")));
        const available = Number(countRow?.cnt ?? 0);
        if (available <= threshold) {
          const [product] = await drizzleDb.select({ name: products.name }).from(products).where(eq(products.id, pkg.productId));
          await notifyOwner({
            title: `⚠️ Kho hàng sắp hết: ${product?.name ?? "Sản phẩm"} - ${pkg.name}`,
            content: `Gói "${pkg.name}" của sản phẩm "${product?.name ?? ""}" hiện chỉ còn ${available} mục trong kho (ngưỡng cảnh báo: ${threshold}). Hãy nhập thêm hàng sớm.`,
          });
          return { notified: true, available, threshold };
        }
        return { notified: false, available, threshold };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await drizzleDb.delete(productInventory).where(eq(productInventory.id, input.id));
        return { success: true };
      }),
    getByOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        return drizzleDb.select().from(productInventory).where(eq(productInventory.assignedOrderId, input.orderId));
      }),
    statsByPackages: protectedProcedure
      .input(z.object({ packageIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and, inArray, sql } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb || input.packageIds.length === 0) return [];
        const rows = await drizzleDb
          .select({
            packageId: productInventory.packageId,
            available: sql<number>`SUM(CASE WHEN ${productInventory.status} = 'available' THEN 1 ELSE 0 END)`,
            total: sql<number>`COUNT(*)`,
          })
          .from(productInventory)
          .where(inArray(productInventory.packageId, input.packageIds))
          .groupBy(productInventory.packageId);
        return rows;
      }),
    countAvailable: publicProcedure
      .input(z.object({ productId: z.number(), packageId: z.number().optional() }))
      .query(async ({ input }) => {
        const { productInventory } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return { count: 0 };
        const conditions = [eq(productInventory.productId, input.productId), eq(productInventory.status, "available")];
        if (input.packageId) conditions.push(eq(productInventory.packageId, input.packageId));
        const items = await drizzleDb.select().from(productInventory).where(and(...conditions));
        return { count: items.length };
      }),
  }),

  // ─── Telegram Bot Management ────────────────────────────────────────────────────────────
  telegramBot: router({
    // Get config for a bot type (admin or user)
    getConfig: protectedProcedure
      .input(z.object({ botType: z.enum(["admin", "user"]) }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const config = await db.getTelegramBotConfig(ctx.user.id, input.botType);
        // Never expose botToken in full - mask it
        if (config?.botToken) {
          return { ...config, botToken: config.botToken.slice(0, 8) + "..." + config.botToken.slice(-4) };
        }
        return config;
      }),

    // Save bot config
    saveConfig: protectedProcedure
      .input(z.object({
        botType: z.enum(["admin", "user"]),
        botToken: z.string().optional(),
        chatId: z.string().optional(),
        enabled: z.boolean().optional(),
        // Admin bot notifications
        notifyNewOrder: z.boolean().optional(),
        notifyPayment: z.boolean().optional(),
        notifyRefund: z.boolean().optional(),
        notifyNewCustomer: z.boolean().optional(),
        notifyLowStock: z.boolean().optional(),
        notifyStatusUpdate: z.boolean().optional(),
        notifyNewReview: z.boolean().optional(),
        notifyNewTopup: z.boolean().optional(),
        notifyFlashSaleEnd: z.boolean().optional(),
        notifyDailyReport: z.boolean().optional(),
        notifyNewTicket: z.boolean().optional(),
        notifyWithdrawal: z.boolean().optional(),
        // User bot notifications
        notifyOrderStatus: z.boolean().optional(),
        notifyOrderCreated: z.boolean().optional(),
        notifyOrderPaid: z.boolean().optional(),
        notifyOrderShipping: z.boolean().optional(),
        notifyOrderCompleted: z.boolean().optional(),
        notifyWarranty: z.boolean().optional(),
        notifyFlashSale: z.boolean().optional(),
        notifyPromotion: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { botType, botToken, ...rest } = input;
        const updateData: any = { ...rest };
        // Only update botToken if it's a full token (not masked)
        if (botToken && !botToken.includes("...")) {
          updateData.botToken = botToken;
          // Fetch bot info to get username
          const { getBotInfo } = await import("./telegram");
          const info = await getBotInfo(botToken);
          if (info.ok) updateData.botUsername = info.username;
        }
        const config = await db.upsertTelegramBotConfig(ctx.user.id, botType, updateData);
        return { success: true, config };
      }),

    // Test bot - send a test message
    testBot: protectedProcedure
      .input(z.object({ botType: z.enum(["admin", "user"]), chatId: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const config = await db.getTelegramBotConfig(ctx.user.id, input.botType);
        if (!config?.botToken) throw new TRPCError({ code: "BAD_REQUEST", message: "Chưa cấu hình Bot Token" });
        const targetChatId = input.chatId || config.chatId;
        if (!targetChatId) throw new TRPCError({ code: "BAD_REQUEST", message: "Chưa có Chat ID" });
        const { sendTelegramMessage } = await import("./telegram");
        const botLabel = input.botType === "admin" ? "Admin Bot" : "User Bot";
        const ok = await sendTelegramMessage(config.botToken, targetChatId,
          `✅ <b>Kết nối thành công!</b>\n\n` +
          `🤖 ${botLabel} đã được cấu hình chính xác.\n` +
          `🕐 ${new Date().toLocaleString("vi-VN")}`
        );
        if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Gửi tin nhắn thất bại. Kiểm tra lại Bot Token và Chat ID." });
        return { success: true };
      }),

    // Set webhook for user bot
    setWebhook: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const config = await db.getTelegramBotConfig(ctx.user.id, "user");
        if (!config?.botToken) throw new TRPCError({ code: "BAD_REQUEST", message: "Chưa cấu hình User Bot Token" });
        const webhookUrl = `${input.origin}/api/webhooks/telegram/user/${ctx.user.id}`;
        const { setTelegramWebhook } = await import("./telegram");
        const ok = await setTelegramWebhook(config.botToken, webhookUrl);
        if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể đặt webhook. Kiểm tra lại Bot Token." });
        await db.upsertTelegramBotConfig(ctx.user.id, "user", { webhookSet: true });
        return { success: true, webhookUrl };
      }),

    // Remove webhook
    removeWebhook: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const config = await db.getTelegramBotConfig(ctx.user.id, "user");
        if (!config?.botToken) throw new TRPCError({ code: "BAD_REQUEST", message: "Chưa cấu hình User Bot Token" });
        const { deleteTelegramWebhook } = await import("./telegram");
        await deleteTelegramWebhook(config.botToken);
        await db.upsertTelegramBotConfig(ctx.user.id, "user", { webhookSet: false });
        return { success: true };
      }),

    // Get subscribers list (user bot)
    getSubscribers: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return db.getTelegramSubscribers(ctx.user.id);
      }),

    // Remove a subscriber
    removeSubscriber: protectedProcedure
      .input(z.object({ subscriberId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.removeTelegramSubscriber(ctx.user.id, input.subscriberId);
        return { success: true };
      }),

    // Send broadcast to all subscribers
    broadcast: protectedProcedure
      .input(z.object({ message: z.string().min(1).max(4096) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const config = await db.getTelegramBotConfig(ctx.user.id, "user");
        if (!config?.botToken || !config.enabled) throw new TRPCError({ code: "BAD_REQUEST", message: "User Bot chưa được kích hoạt" });
        const subscribers = await db.getTelegramSubscribers(ctx.user.id);
        const active = subscribers.filter((s: any) => s.isActive);
        const { sendTelegramMessage } = await import("./telegram");
        let sent = 0;
        for (const sub of active) {
          const ok = await sendTelegramMessage(config.botToken, sub.chatId, input.message);
          if (ok) sent++;
        }
        return { success: true, sent, total: active.length };
      }),
  }),
});

// ───────────────────────────────────────────────────────────────────────────────
// License Router - Quản lý license key
// ───────────────────────────────────────────────────────────────────────────────
export const licenseRouter = router({
  // Lấy trạng thái license hiện tại
  getStatus: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const { userSettings } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return { activated: false, licenseKey: null, plan: null, expiresAt: null, owner: null, domain: null };
    const rows = await db.select({
      licenseActivated: userSettings.licenseActivated,
      licenseKey: userSettings.licenseKey,
      licenseEmail: userSettings.licenseEmail,
      licensePlan: userSettings.licensePlan,
      licenseExpiresAt: userSettings.licenseExpiresAt,
      licenseOwner: userSettings.licenseOwner,
      licenseDomain: userSettings.licenseDomain,
      licenseMessage: userSettings.licenseMessage,
      licenseActivatedAt: userSettings.licenseActivatedAt,
    }).from(userSettings).limit(1);
    const s = rows[0];
    if (!s) return { activated: false, licenseKey: null, email: null, plan: null, expiresAt: null, owner: null, domain: null };
    return {
      activated: s.licenseActivated ?? false,
      licenseKey: s.licenseKey ? `${s.licenseKey.substring(0, 8)}...${s.licenseKey.slice(-4)}` : null,
      email: s.licenseEmail || null,
      plan: s.licensePlan,
      expiresAt: s.licenseExpiresAt ? s.licenseExpiresAt.toISOString() : null,
      owner: s.licenseOwner,
      domain: s.licenseDomain,
      message: s.licenseMessage,
      activatedAt: s.licenseActivatedAt ? s.licenseActivatedAt.toISOString() : null,
    };
  }),

  // Kích hoạt license key
  activate: publicProcedure.input(z.object({
    licenseKey: z.string().min(19, "License key không hợp lệ (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)"),
    email: z.string().email("Email không hợp lệ"),
    domain: z.string().optional(),
    activationToken: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    // Rate limiting: chống brute-force activation
    const { checkActivationRateLimit } = await import("./license");
    const clientIp = (ctx as any).req?.ip || (ctx as any).req?.socket?.remoteAddress || "unknown";
    const rateCheck = checkActivationRateLimit(clientIp);
    if (!rateCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Quá nhiều lần thử kích hoạt. Vui lòng thử lại sau ${rateCheck.retryAfter} giây.`,
      });
    }

    const { getDb } = await import("./db");
    const { userSettings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database không khả dụng" });

    const { validateLicense, isValidKeyFormat, normalizeDomain, normalizeEmail, createOfflineToken } = await import("./license-crypto");

    if (!isValidKeyFormat(input.licenseKey)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "License key không đúng định dạng (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)" });
    }

    const currentDomain = input.domain || process.env.APP_DOMAIN || "localhost";
    let licenseInfo: { valid: boolean; plan: string; expiresAt?: string; owner?: string } = {
      valid: false, plan: "standard",
    };

    // ─── Phương thức 1: Offline HMAC validation (nếu có activationToken) ────────
    if (input.activationToken) {
      const result = validateLicense(input.activationToken, input.email, currentDomain);
      if (!result.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.reason || "License key không hợp lệ" });
      }
      licenseInfo = {
        valid: true,
        plan: result.payload?.plan || "standard",
        expiresAt: result.payload?.expiresAt ? new Date(result.payload.expiresAt).toISOString() : undefined,
        owner: result.payload?.owner,
      };
      console.log(`[License] Activated via offline HMAC for ${normalizeEmail(input.email)} on ${normalizeDomain(currentDomain)}`);
    }
    // ─── Phương thức 2: Online License Server validation ─────────────────────────
    else {
      const licenseServerUrl = process.env.LICENSE_SERVER_URL;
      if (licenseServerUrl) {
        try {
          const response = await fetch(`${licenseServerUrl}/api/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: input.licenseKey,
              email: normalizeEmail(input.email),
              domain: normalizeDomain(currentDomain),
            }),
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({})) as any;
            throw new TRPCError({ code: "BAD_REQUEST", message: data.message || "License key không hợp lệ" });
          }
          const serverResult = await response.json() as any;
          if (!serverResult.valid) {
            throw new TRPCError({ code: "BAD_REQUEST", message: serverResult.message || "License key không hợp lệ" });
          }
          licenseInfo = { valid: true, plan: serverResult.plan || "standard", expiresAt: serverResult.expiresAt, owner: serverResult.owner };
          // Tạo activation token v2 (HMAC-signed) để lưu vào DB cho offline validation
          // Token này sẽ được dùng để verify offline mà không cần gọi license server mỗi lần
          try {
            const offlineToken = createOfflineToken(
              normalizeEmail(input.email),
              normalizeDomain(currentDomain),
              serverResult.plan || "standard",
              serverResult.expiresAt ? new Date(serverResult.expiresAt).getTime() : 0,
              input.licenseKey,
              serverResult.owner,
            );
            // Ghi đè activationToken bằng token mới
            (input as any).activationToken = offlineToken;
          } catch (tokenErr: any) {
            // Nếu không tạo được token (thiếu LICENSE_MASTER_KEY), vẫn lưu key nhưng không có offline token
            console.warn("[License] Could not create offline token:", tokenErr.message);
          }
          console.log(`[License] Activated via License Server for ${normalizeEmail(input.email)}`);
        } catch (err: any) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "BAD_REQUEST", message: "Không thể xác thực license. Vui lòng liên hệ hỗ trợ." });
        }
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cần activation token để kích hoạt offline. Liên hệ nhà cung cấp để nhận token.",
        });
      }
    }

    // ─── Lưu license vào DB ───────────────────────────────────────────────────────
    const rows = await db.select({ id: userSettings.id }).from(userSettings).limit(1);
    const settingsId = rows[0]?.id;
    const updateData: any = {
      licenseKey: input.licenseKey,
      licenseEmail: normalizeEmail(input.email),
      licenseSignature: input.activationToken || null,
      licenseActivated: true,
      licenseActivatedAt: new Date(),
      licensePlan: licenseInfo.plan || "standard",
      licenseOwner: licenseInfo.owner || null,
      licenseDomain: normalizeDomain(currentDomain),
      licenseMessage: null,
    };
    if (licenseInfo.expiresAt) {
      updateData.licenseExpiresAt = new Date(licenseInfo.expiresAt);
    }
    if (settingsId) {
      await db.update(userSettings).set(updateData).where(eq(userSettings.id, settingsId));
    } else {
      await db.insert(userSettings).values(updateData);
    }
    return { success: true, plan: licenseInfo.plan || "standard", message: "Kích hoạt license thành công!" };
  }),
  // Hủy kích hoạt license (admin only)
  deactivate: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const { getDb } = await import("./db");
    const { userSettings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({ id: userSettings.id }).from(userSettings).limit(1);
    if (rows[0]) {
      await db.update(userSettings).set({
        licenseActivated: false,
        licenseKey: null,
        licenseActivatedAt: null,
        licenseExpiresAt: null,
        licensePlan: "standard",
        licenseOwner: null,
        licenseDomain: null,
      }).where(eq(userSettings.id, rows[0].id));
    }
    return { success: true };
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Update Router - Quản lý cập nhật từ GitHub
// ─────────────────────────────────────────────────────────────────────────────
export const updateRouter = router({
  // Lấy trạng thái cập nhật
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const { getDb } = await import("./db");
    const { userSettings } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({
      githubRepo: userSettings.githubRepo,
      githubBranch: userSettings.githubBranch,
      githubToken: userSettings.githubToken,
      githubWebhookSecret: userSettings.githubWebhookSecret,
      autoUpdate: userSettings.autoUpdate,
      currentVersion: userSettings.currentVersion,
      latestVersion: userSettings.latestVersion,
      updateAvailable: userSettings.updateAvailable,
      lastUpdateCheck: userSettings.lastUpdateCheck,
      lastUpdateAt: userSettings.lastUpdateAt,
    }).from(userSettings).limit(1);
    const s = rows[0];
    if (!s) return {
      githubRepo: null, githubBranch: "main", autoUpdate: false,
      currentVersion: "1.0.0", latestVersion: null, updateAvailable: false,
      lastUpdateCheck: null, lastUpdateAt: null, isUpdating: false, logs: [],
    };
    const { isUpdateInProgress, getUpdateLogs } = await import("./auto-update");
    return {
      githubRepo: s.githubRepo,
      githubBranch: s.githubBranch || "main",
      hasToken: !!s.githubToken,
      hasWebhookSecret: !!s.githubWebhookSecret,
      autoUpdate: s.autoUpdate ?? false,
      currentVersion: s.currentVersion || "1.0.0",
      latestVersion: s.latestVersion,
      updateAvailable: s.updateAvailable ?? false,
      lastUpdateCheck: s.lastUpdateCheck ? s.lastUpdateCheck.toISOString() : null,
      lastUpdateAt: s.lastUpdateAt ? s.lastUpdateAt.toISOString() : null,
      isUpdating: isUpdateInProgress(),
      logs: getUpdateLogs().slice(0, 20),
    };
  }),

   // Kiểm tra phiên bản mới thủ công
  checkNow: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const { checkForUpdates } = await import("./auto-update");
    const result = await checkForUpdates();
    return result;
  }),

  // Cập nhật thủ công
  updateNow: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const { performUpdate } = await import("./auto-update");
    const result = await performUpdate("manual");
    return result;
  }),

});

// ─────────────────────────────────────────────────────────────────────────────
// Full Router - Merge all sub-routers (MUST be at the end of file)
// ─────────────────────────────────────────────────────────────────────────────
// ─── Setup Wizard ────────────────────────────────────────────────────────────
const setupRouter = router({
  // Kiểm tra xem hệ thống đã được setup chưa (public - không cần auth)
  check: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return { setupRequired: true };
    const { users } = await import("../drizzle/schema");
    const adminUsers = await drizzleDb.select({ id: users.id }).from(users).limit(1);
    return { setupRequired: adminUsers.length === 0 };
  }),

  // Hoàn tất setup lần đầu (public - chỉ hoạt động khi chưa có user nào)
  complete: publicProcedure
    .input(z.object({
      // Thông tin website
      companyName: z.string().min(1, "Tên website là bắt buộc"),
      siteTitle: z.string().optional(),
      siteDescription: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().email().optional().or(z.literal("")),
      companyAddress: z.string().optional(),
      website: z.string().optional(),
      hotline: z.string().optional(),
      // Tài khoản admin
      adminUsername: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
      adminPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
      adminName: z.string().min(1, "Tên admin là bắt buộc"),
      adminEmail: z.string().email("Email không hợp lệ"),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database không khả dụng" });
      const { users, userSettings } = await import("../drizzle/schema");
      // Kiểm tra lại: chỉ cho phép setup khi chưa có user nào
      const existingUsers = await drizzleDb.select({ id: users.id }).from(users).limit(1);
      if (existingUsers.length > 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Hệ thống đã được cài đặt. Không thể chạy setup lại." });
      }
      // Tạo tài khoản admin
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(input.adminPassword, 10);
      const adminEmail = input.adminEmail || `${input.adminUsername}@admin.local`;
      const [adminResult] = await drizzleDb.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        name: input.adminName,
        role: "admin",
      });
      const adminId = (adminResult as any).insertId as number;
      // Lưu thông tin website vào settings
      await drizzleDb.insert(userSettings).values({
        userId: adminId,
        companyName: input.companyName,
        siteTitle: input.siteTitle || input.companyName,
        siteDescription: input.siteDescription || "",
        companyPhone: input.companyPhone || "",
        companyEmail: input.companyEmail || adminEmail,
        companyAddress: input.companyAddress || "",
        website: input.website || "",
        hotline: input.hotline || "",
      });
      return { success: true, message: "Cài đặt hoàn tất! Bạn có thể đăng nhập ngay bây giờ." };
    }),
});

// ─── Side Banners Router ─────────────────────────────────────────────────────
const sideBannersRouter = router({
  getPublic: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return [];
    const { sideBanners, users } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
    if (!owner) return [];
    const left = await drizzleDb.select().from(sideBanners).where(and(eq(sideBanners.userId, owner.id), eq(sideBanners.position, "left"), eq(sideBanners.isActive, true))).orderBy(sideBanners.sortOrder).limit(1);
    const right = await drizzleDb.select().from(sideBanners).where(and(eq(sideBanners.userId, owner.id), eq(sideBanners.position, "right"), eq(sideBanners.isActive, true))).orderBy(sideBanners.sortOrder).limit(1);
    return [left[0] || null, right[0] || null].filter(Boolean);
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return [];
    const { sideBanners } = await import("../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    return drizzleDb.select().from(sideBanners).where(eq(sideBanners.userId, ctx.user.id)).orderBy(sideBanners.sortOrder);
  }),
  upsert: protectedProcedure.input(z.object({
    id: z.number().optional(),
    position: z.enum(["left", "right"]),
    imageUrl: z.string(),
    linkUrl: z.string().optional(),
    title: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
  })).mutation(async ({ ctx, input }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { sideBanners } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    if (input.id) {
      await drizzleDb.update(sideBanners).set({ ...input, userId: ctx.user.id, updatedAt: new Date() }).where(and(eq(sideBanners.id, input.id), eq(sideBanners.userId, ctx.user.id)));
      return { success: true };
    }
    await drizzleDb.insert(sideBanners).values({ ...input, userId: ctx.user.id });
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { sideBanners } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    await drizzleDb.delete(sideBanners).where(and(eq(sideBanners.id, input.id), eq(sideBanners.userId, ctx.user.id)));
    return { success: true };
  }),
});

//// ─── Mini Banners Router ──────────────────────────────────────────────
const miniBannersRouter = router({
  getPublic: publicProcedure.query(async () => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return [];
    const { miniBanners, users } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    const [owner] = await drizzleDb.select({ id: users.id }).from(users).limit(1);
    if (!owner) return [];
    return drizzleDb.select().from(miniBanners).where(and(eq(miniBanners.userId, owner.id), eq(miniBanners.isActive, true))).orderBy(miniBanners.sortOrder).limit(8);
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return [];
    const { miniBanners } = await import("../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    return drizzleDb.select().from(miniBanners).where(eq(miniBanners.userId, ctx.user.id)).orderBy(miniBanners.sortOrder);
  }),
  upsert: protectedProcedure.input(z.object({
    id: z.number().optional(),
    imageUrl: z.string(),
    linkUrl: z.string().optional(),
    title: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
  })).mutation(async ({ ctx, input }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { miniBanners } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    if (input.id) {
      await drizzleDb.update(miniBanners).set({ ...input, userId: ctx.user.id, updatedAt: new Date() }).where(and(eq(miniBanners.id, input.id), eq(miniBanners.userId, ctx.user.id)));
      return { success: true };
    }
    await drizzleDb.insert(miniBanners).values({ ...input, userId: ctx.user.id });
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { miniBanners } = await import("../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    await drizzleDb.delete(miniBanners).where(and(eq(miniBanners.id, input.id), eq(miniBanners.userId, ctx.user.id)));
    return { success: true };
  }),
});

const appRouterFull = router({
  ...appRouter._def.record,
  license: licenseRouter,
  update: updateRouter,
  setup: setupRouter,
  sideBanners: sideBannersRouter,
  miniBanners: miniBannersRouter,
});
export { appRouterFull };
export type AppRouter = typeof appRouterFull;
