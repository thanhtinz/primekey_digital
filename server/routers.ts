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
        await db.createInvoice({
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
        await db.createInvoiceTemplate({
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
  }),

  // Email Notifications
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
