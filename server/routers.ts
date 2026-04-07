import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateInvoicePDF } from "./pdf";
import { generateInvoiceExcel } from "./excel";
import { sendEmail, generateInvoiceEmailHTML, generatePaymentConfirmationEmailHTML, generateStatusUpdateEmailHTML } from "./email";
import crypto from "crypto";
import { createPayOSPaymentLink, getPayOSPaymentStatus } from "./payos";

// Telegram notification helper
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
        status: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]),
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
        
        // Send email notification if requested OR when reaching WARRANTY (auto-send review link)
        const shouldSendEmail = input.sendEmail || input.status === "WARRANTY";
        if (shouldSendEmail) {
          const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
          if (customer?.email) {
            const userSettings = await db.getUserSettings(ctx.user.id);
            const statusLabels: Record<string, string> = {
              CREATED: "Tạo Đơn", PAID: "Đã Thanh Toán", SHIPPING: "Đang Giao Hàng",
              WARRANTY: "Bảo Hành", FAILED: "Thất Bại", EXPIRED: "Hết Hạn",
            };
            // Build base URL from origin (passed by frontend) or VITE_APP_URL fallback
            const baseUrl = input.origin || process.env.VITE_APP_URL || "";
            const reviewUrl = reviewToken ? `${baseUrl}/review/${reviewToken}` : undefined;
            const trackUrl = `${baseUrl}/track-order`;
            // Try to load custom email template from DB, fallback to default
            const emailType = input.status as "CREATED" | "PAID" | "SHIPPING" | "WARRANTY" | "REVIEW";
            const customTemplate = await db.getEmailTemplateByType(ctx.user.id, emailType).catch(() => null);
            const companyName = userSettings?.companyName || "Invoice Prime";
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
        newStatus: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]),
        note: z.string().optional(),
        regeneratePaymentLink: z.boolean().optional(), // true = tạo lại QR PayOS
        origin: z.string().optional(), // window.location.origin từ frontend
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) throw new Error("Invoice not found");

        const statusLabels: Record<string, string> = {
          CREATED: "Tạo Đơn", PAID: "Đã Thanh Toán", SHIPPING: "Đang Giao Hàng",
          WARRANTY: "Bảo Hành", FAILED: "Thất Bại", EXPIRED: "Hết Hạn",
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
                  cancelUrl: `${origin}/track-order`,
                  webhookUrl: `${origin}/api/webhooks/payos`,
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
        let paymentLinkRegenOk = !!(paymentUrl && (input.regeneratePaymentLink || input.newStatus === "CREATED"));
        const autoEmailStatuses = ["PAID", "SHIPPING", "WARRANTY", "CREATED"];
        if (autoEmailStatuses.includes(input.newStatus)) {
          try {
            const customer = invoice.customerId ? await db.getCustomerById(invoice.customerId) : null;
            if (customer?.email) {
              const userSettings = await db.getUserSettings(ctx.user.id);
              const companyName = userSettings?.companyName || "Invoice Prime";
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
          } catch (emailErr) {
            console.error("[manualTransition] Email error:", emailErr);
            // Continue without failing
          }
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
          companyLogo: defaultTemplate?.logo || null,
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
            cancelUrl: `${origin}/track-order`,
            webhookUrl: `${origin}/api/webhooks/payos`,
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
        const invoiceList = await db.getInvoicesByCustomerEmail(input.email);
        // Return safe data only (no internal fields)
        return invoiceList.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          totalAmount: inv.totalAmount,
          currency: inv.currency,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
          notes: inv.notes,
        }));
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
          CREATED: "Tạo Đơn", PAID: "Đã Thanh Toán", SHIPPING: "Đang Giao",
          WARRANTY: "Bảo Hành", FAILED: "Thất Bại", EXPIRED: "Hết Hạn",
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
          const companyName = userSettings?.companyName || "Invoice Prime";
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
  }),

  // Products
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getProductsByUserId(ctx.user.id);
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
          price: z.number(),
          unit: z.string().optional(),
          warrantyMonths: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createProduct({
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
          description: z.string().optional(),
          price: z.number().optional(),
          unit: z.string().optional(),
          warrantyMonths: z.number().min(0).optional(),
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
          paypalClientId: z.string().optional(),
          paypalSecret: z.string().optional(),
          paypalMode: z.enum(["sandbox", "live"]).optional(),
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
      .input(z.object({ gateway: z.enum(["payos", "paypal"]) }))
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
          if (!config.paypalClientId || !config.paypalSecretKey) {
            return { success: false, message: "Thiếu thông tin cấu hình PayPal" };
          }
          try {
            const base = config.paypalMode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
            const creds = Buffer.from(`${config.paypalClientId}:${config.paypalSecretKey}`).toString("base64");
            const res = await fetch(`${base}/v1/oauth2/token`, {
              method: "POST",
              headers: {
                "Authorization": `Basic ${creds}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: "grant_type=client_credentials",
              signal: AbortSignal.timeout(5000),
            });
            const ok = res.ok;
            return { success: ok, message: ok ? "Kết nối PayPal thành công" : "Client ID hoặc Secret Key không hợp lệ" };
          } catch {
            return { success: false, message: "Không thể kết nối đến PayPal" };
          }
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
        
        const html = generatePaymentConfirmationEmailHTML({
          invoiceNumber: invoice.invoiceNumber,
          customerName: "Customer Name",
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          paidAt: invoice.paidAt || new Date(),
          companyName: "Your Company",
        });
        
        const success = await sendEmail({
          to: input.recipientEmail,
          subject: `Xác Nhận Thanh Toán - ${invoice.invoiceNumber}`,
          html,
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
      // Don't return password
      return {
        id: config.id,
        host: config.host,
        port: config.port,
        user: config.user,
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
        const success = await sendEmail({
          to: input.testEmail,
          subject: "Test Email - Invoice Prime",
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
        const email = `${input.username}@invoiceprime.com`;
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
        body: JSON.stringify({ chat_id: settings.telegramChatId, text: "✅ Invoice Prime: Kết nối Telegram thành công!" }),
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
          companyName: settings?.companyName || "Invoice Prime",
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
});
export type AppRouter = typeof appRouter;
