import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // hashed password
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Customers table
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  taxCode: varchar("taxCode", { length: 50 }),
  totalSpent: decimal("totalSpent", { precision: 15, scale: 2 }).default("0"),
  totalPaid: decimal("totalPaid", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  taxId: int("taxId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Taxes table
export const taxes = mysqlTable("taxes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  mode: mysqlEnum("mode", ["inclusive", "exclusive"]).default("exclusive"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tax = typeof taxes.$inferSelect;
export type InsertTax = typeof taxes.$inferInsert;

// Discount Codes table
export const discountCodes = mysqlTable("discountCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["percentage", "fixed"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxUsage: int("maxUsage"),
  usageCount: int("usageCount").default(0),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

// Invoice Templates table
export const invoiceTemplates = mysqlTable("invoiceTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyAddress: text("companyAddress"),
  companyPhone: varchar("companyPhone", { length: 20 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  companyTaxCode: varchar("companyTaxCode", { length: 50 }),
  logo: text("logo"), // URL to logo
  invoiceTitle: varchar("invoiceTitle", { length: 255 }).default("Hóa Đơn Bán Hàng"),
  footer: text("footer"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = typeof invoiceTemplates.$inferInsert;

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  templateId: int("templateId"),
  currency: mysqlEnum("currency", ["VND", "USD"]).default("VND"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 15, scale: 2 }).default("0"),
  discountCodeId: int("discountCodeId"),
  taxAmount: decimal("taxAmount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["CREATED", "PAID", "SHIPPING", "WARRANTY", "FAILED", "EXPIRED"]).default("CREATED"),
  reviewToken: varchar("reviewToken", { length: 64 }),
  reviewSubmitted: boolean("reviewSubmitted").default(false),
  paymentMethod: mysqlEnum("paymentMethod", ["PAYOS", "PAYPAL", "BANK_TRANSFER", "CASH"]),
  paymentUrl: text("paymentUrl"),
  qrCode: text("qrCode"),
  paymentTransactionId: varchar("paymentTransactionId", { length: 100 }),
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Invoice Items table
export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  productId: int("productId"),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 15, scale: 2 }).default("0"),
  taxId: int("taxId"),
  taxAmount: decimal("taxAmount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

// Payment Gateways Config table
export const paymentGatewaysConfig = mysqlTable("paymentGatewaysConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  payosApiKey: text("payosApiKey"), // encrypted
  payosClientId: text("payosClientId"), // encrypted
  payosChecksumKey: text("payosChecksumKey"), // encrypted
  paypalClientId: text("paypalClientId"), // encrypted
  paypalSecretKey: text("paypalSecretKey"), // encrypted
  paypalMode: mysqlEnum("paypalMode", ["sandbox", "live"]).default("sandbox"),
  invoiceExpiryHours: int("invoiceExpiryHours").default(48),
  enableWebhook: boolean("enableWebhook").default(true),
  enableEmailNotification: boolean("enableEmailNotification").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentGatewaysConfig = typeof paymentGatewaysConfig.$inferSelect;
export type InsertPaymentGatewaysConfig = typeof paymentGatewaysConfig.$inferInsert;

// User Settings table (company info, preferences)
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: varchar("companyName", { length: 255 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  companyPhone: varchar("companyPhone", { length: 20 }),
  companyAddress: text("companyAddress"),
  taxId: varchar("taxId", { length: 50 }),
  website: varchar("website", { length: 500 }),
  emailNotifications: boolean("emailNotifications").default(true),
  invoiceReminder: boolean("invoiceReminder").default(true),
  paymentConfirmation: boolean("paymentConfirmation").default(true),
  weeklyReport: boolean("weeklyReport").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Audit Logs table
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  changes: json("changes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Reviews table
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  customerId: int("customerId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  customerName: varchar("customerName", { length: 255 }),
  productName: varchar("productName", { length: 255 }),
  isPublic: boolean("isPublic").default(true),
  isApproved: boolean("isApproved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// SMTP Config table
export const smtpConfig = mysqlTable("smtpConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  host: varchar("host", { length: 255 }),
  port: int("port").default(587),
  user: varchar("user", { length: 320 }),
  password: text("password"),
  fromName: varchar("fromName", { length: 255 }),
  fromEmail: varchar("fromEmail", { length: 320 }),
  secure: boolean("secure").default(false),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmtpConfig = typeof smtpConfig.$inferSelect;
export type InsertSmtpConfig = typeof smtpConfig.$inferInsert;