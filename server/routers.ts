import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
        return invoice;
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
          status: z.enum(["PENDING", "PAID", "FAILED", "EXPIRED"]),
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
          status: z.enum(["PENDING", "PAID", "FAILED", "EXPIRED"]).optional(),
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
        PENDING: invoices.filter(inv => inv.status === "PENDING").length,
        PAID: invoices.filter(inv => inv.status === "PAID").length,
        FAILED: invoices.filter(inv => inv.status === "FAILED").length,
        EXPIRED: invoices.filter(inv => inv.status === "EXPIRED").length,
      };
      
      return stats;
    }),
  }),
});

export type AppRouter = typeof appRouter;
