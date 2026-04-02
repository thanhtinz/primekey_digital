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
          status: z.enum(["draft", "sent", "paid", "expired"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        // TODO: Implement invoice creation
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
        // TODO: Implement customer creation
        return { success: true };
      }),
  }),

  // Products
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getProductsByUserId(ctx.user.id);
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
        // TODO: Implement product creation
        return { success: true };
      }),
  }),

  // Taxes
  taxes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getTaxesByUserId(ctx.user.id);
    }),
  }),

  // Discount Codes
  discountCodes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getDiscountCodesByUserId(ctx.user.id);
    }),
  }),

  // Invoice Templates
  invoiceTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return db.getInvoiceTemplatesByUserId(ctx.user.id);
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
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        // TODO: Implement payment gateway config update
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
