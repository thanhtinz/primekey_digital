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
import { createPayOSPaymentLink } from "./payos";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
      return db.getInvoicesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        // Fetch customer email if customerId exists
        let customerEmail: string | null = null;
        let customerName: string | null = null;
        if (invoice.customerId) {
          const customer = await db.getCustomerById(invoice.customerId);
          customerEmail = customer?.email || null;
          customerName = customer?.name || null;
        }
        return { ...invoice, customerEmail, customerName };
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
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { dueDate, issueDate, ...rest } = input;
        await db.createInvoice({
          ...rest,
          userId: ctx.user.id,
          expiresAt: dueDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        await db.updateInvoice(input.id, {
          ...input,
          updatedAt: new Date(),
        });
        return { success: true };
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
            // Build base URL from VITE_APP_URL or fallback
            const baseUrl = process.env.VITE_APP_URL || "";
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

        // Update invoice status
        await db.updateInvoice(input.id, {
          status: input.newStatus,
          reviewToken,
          paidAt: input.newStatus === "PAID" ? new Date() : invoice.paidAt,
          paymentUrl: paymentUrl || invoice.paymentUrl,
          qrCode: qrCode || invoice.qrCode,
          paymentTransactionId: paymentLinkId || invoice.paymentTransactionId,
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
                .replace(/{{paymentUrl}}/g, paymentUrl || "");
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
              } else if (input.newStatus === "CREATED" && paymentUrl) {
                // Use invoice email template with payment link when regenerating QR
                html = generateInvoiceEmailHTML({
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: customer.name,
                  totalAmount: Number(invoice.totalAmount),
                  currency: invoice.currency || "VND",
                  companyName,
                  paymentUrl,
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
      return db.getPaymentGatewaysConfigByUserId(ctx.user.id);
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
      // Return products with basic info (invoice items not tracked per product in current schema)
      return products.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === "string" ? parseFloat(p.price) : (p.price || 0),
        category: p.category || "",
      }));
    }),
  }),
  // User Settingss
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getUserSettings(ctx.user.id);
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
      .input(z.object({ invoiceId: z.number(), recipientEmail: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice || invoice.userId !== ctx.user.id) {
          throw new Error("Invoice not found");
        }
        
        const html = generateInvoiceEmailHTML({
          invoiceNumber: invoice.invoiceNumber,
          customerName: "Customer Name",
          totalAmount: typeof invoice.totalAmount === "string" ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
          currency: invoice.currency || "VND",
          companyName: "Your Company",
          paymentUrl: invoice.paymentUrl || undefined,
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
        return db.getEmailTemplateByType(ctx.user.id, input.type);
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
});
export type AppRouter = typeof appRouter;
