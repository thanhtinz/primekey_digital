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
        let emailError: string | undefined;
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
          } catch (emailErr: any) {
            console.error("[manualTransition] Email error:", emailErr);
            emailError = emailErr?.message || "Gửi email thất bại";
            // Continue without failing - status change still succeeds
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
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const { products: productsTable, productPackages, productCategories } = await import("../drizzle/schema");
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
      return productRows.map(p => ({
        ...p,
        packages: allPackages.filter(pkg => pkg.productId === p.id),
        categoryName: allCategories.find(c => c.id === p.categoryId)?.name || null,
        parentCategoryName: (() => {
          const cat = allCategories.find(c => c.id === p.categoryId);
          if (!cat?.parentId) return null;
          return allCategories.find(c => c.id === cat.parentId)?.name || null;
        })(),
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
        const { products: productsTable, productPackages, productCategories, users } = await import("../drizzle/schema");
        const { eq, and, inArray } = await import("drizzle-orm");
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
        return productRows.map(p => ({
          ...p,
          packages: allPackages.filter(pkg => pkg.productId === p.id),
          categoryName: allCategories.find(c => c.id === p.categoryId)?.name || null,
          parentCategoryName: (() => {
            const cat = allCategories.find(c => c.id === p.categoryId);
            if (!cat?.parentId) return null;
            return allCategories.find(c => c.id === cat.parentId)?.name || null;
          })(),
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
          pkgs.forEach((pkg: any) => {
            const price = Number(pkg.price);
            if (!pricesMap[pkg.productId] || price < pricesMap[pkg.productId]) {
              pricesMap[pkg.productId] = price;
            }
          });
        }
        return related.map((p: any) => ({ ...p, minPrice: pricesMap[p.id] || null }));
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
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await db.createProduct({
          name: input.name,
          description: input.description,
          categoryId: input.categoryId || null,
          imageUrl: input.imageUrl,
          notes: input.notes,
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
          categoryId: z.number().nullable().optional(),
          imageUrl: z.string().optional(),
          notes: z.string().optional(),
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
        description: z.string().optional(),
        warrantyMonths: z.number().min(0).optional(),
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
          description: input.description,
          warrantyMonths: input.warrantyMonths ?? 0,
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
        description: z.string().optional(),
        warrantyMonths: z.number().min(0).optional(),
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
        const { id, price, originalPrice, ...rest } = input;
        const updateData: any = { ...rest };
        if (price !== undefined) updateData.price = String(price);
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice !== null ? String(originalPrice) : null;
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
      return drizzleDb.select().from(productCustomFields).where(eq(productCustomFields.productId, input.productId)).orderBy(asc(productCustomFields.sortOrder));
    }),
    createCustomField: protectedProcedure.input(z.object({
      productId: z.number(),
      fieldName: z.string().min(1),
      fieldValue: z.string().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const product = await db.getProductById(input.productId);
      if (!product || product.userId !== ctx.user.id) throw new Error("Not found");
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(productCustomFields).values({ productId: input.productId, fieldName: input.fieldName, fieldValue: input.fieldValue || null, sortOrder: input.sortOrder || 0 });
      return { success: true };
    }),
    updateCustomField: protectedProcedure.input(z.object({
      id: z.number(),
      fieldName: z.string().optional(),
      fieldValue: z.string().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { productCustomFields } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const { id, ...updates } = input;
      await drizzleDb.update(productCustomFields).set(updates as any).where(eq(productCustomFields.id, id));
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
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(productReviews).where(and(eq(productReviews.productId, input.productId), eq(productReviews.isApproved, true))).orderBy(desc(productReviews.createdAt));
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
      const { productReviews } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc, eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      const conditions: any[] = [];
      if (input?.productId) conditions.push(eq(productReviews.productId, input.productId));
      return drizzleDb.select().from(productReviews).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(productReviews.createdAt));
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
      const { productCategories } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { asc, isNotNull } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      // Only return categories that have userId (belong to a shop owner)
      return drizzleDb.select().from(productCategories).where(isNotNull(productCategories.userId)).orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
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
      const { loyaltySettings } = await import("../drizzle/schema");
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
    list: protectedProcedure.query(async ({ ctx }) => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(refunds).where(eq(refunds.userId, ctx.user.id)).orderBy(desc(refunds.createdAt));
    }),
    create: protectedProcedure.input(z.object({
      invoiceId: z.number(),
      amount: z.number().min(0),
      reason: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.insert(refunds).values({ ...input, userId: ctx.user.id, amount: String(input.amount), status: "PENDING" });
      return { success: true };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSED"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      const updates: any = { status: input.status, adminNote: input.adminNote || null };
      if (input.status === "PROCESSED") updates.processedAt = new Date();
      await drizzleDb.update(refunds).set(updates).where(and(eq(refunds.id, input.id), eq(refunds.userId, ctx.user.id)));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const { refunds } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB unavailable");
      await drizzleDb.delete(refunds).where(and(eq(refunds.id, input.id), eq(refunds.userId, ctx.user.id)));
      return { success: true };
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
        const { customerSessions } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, gt } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        if (!drizzleDb) return null;
        const [session] = await drizzleDb.select().from(customerSessions)
          .where(eq(customerSessions.token, input.token)).limit(1);
        if (!session || session.expiresAt < new Date()) return null;
        return { email: session.email, name: session.name, avatarUrl: (session as any).avatarUrl || null };
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
        // Save avatar URL to session
        await drizzleDb.update(customerSessions).set({ avatarUrl: url } as any).where(eq(customerSessions.token, input.token));
        return { url };
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
  }),

  // ─── Cart ──────────────────────────────────────────────────────────────────
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
      const { referralSettings } = await import("../drizzle/schema");
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
      const { referrals } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { desc } = await import("drizzle-orm");
      const drizzleDb = await getDb();
      if (!drizzleDb) return [];
      return drizzleDb.select().from(referrals).orderBy(desc(referrals.createdAt)).limit(200);
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
      origin: z.string(), // window.location.origin
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
      const unitPrice = Number(pkg.price);
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

      const totalAmount = Math.max(subtotal - discountAmount, 0);

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
        taxAmount: "0",
        totalAmount: String(totalAmount),
        status: "CREATED",
        paymentMethod: "PAYOS",
        notes: input.customFieldValues ? JSON.stringify(input.customFieldValues) : null,
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
              cancelUrl: `${input.origin}/product/${input.productId}`,
              webhookUrl: `${input.origin}/api/webhooks/payos`,
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

      // Send email to customer with payment link (same as admin manual invoice)
      try {
        const db = await import("./db");
        const userSettings = await db.getUserSettings(owner.id);
        const companyName = userSettings?.companyName || "Invoice Prime";
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
      } catch (emailErr) {
        console.error("[checkout.buyNow] Email error:", emailErr);
      }

      // Send Telegram notification
      void sendTelegramNotification(owner.id, `🛒 <b>Đơn hàng mới (Mua ngay)</b>\nMã: ${invoiceNumber}\nKhách: ${input.email}\nSP: ${product.name} - ${pkg.name}\nTổng: ${totalAmount.toLocaleString("vi-VN")}đ`);

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
      origin: z.string(),
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

      const totalAmount = Math.max(subtotal - discountAmount, 0);

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
        taxAmount: "0",
        totalAmount: String(totalAmount),
        status: "CREATED",
        paymentMethod: "PAYOS",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any);

      const [createdInvoice] = await drizzleDb.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
      if (!createdInvoice) throw new Error("Không thể tạo đơn hàng");

      // Record coupon usage with invoiceId
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
              cancelUrl: `${input.origin}/cart`,
              webhookUrl: `${input.origin}/api/webhooks/payos`,
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

      // Send email to customer with payment link (same as admin manual invoice)
      try {
        const db = await import("./db");
        const userSettings = await db.getUserSettings(owner.id);
        const companyName = userSettings?.companyName || "Invoice Prime";
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

      // Send Telegram notification
      const itemNames = input.items.map(i => `${i.name} x${i.quantity}`).join(", ");
      void sendTelegramNotification(owner.id, `🛒 <b>Đơn hàng mới (Giỏ hàng)</b>\nMã: ${invoiceNumber}\nKhách: ${input.email}\nSP: ${itemNames}\nTổng: ${totalAmount.toLocaleString("vi-VN")}đ`);

      return { success: true, invoiceId: createdInvoice.id, invoiceNumber, paymentUrl, qrCode };
    }),
  }),
});
export type AppRouter = typeof appRouter;
