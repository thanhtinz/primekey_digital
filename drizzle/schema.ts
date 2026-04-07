import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, mediumtext } from "drizzle-orm/mysql-core";

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
  companyName: varchar("companyName", { length: 255 }).default("").notNull(),
  companyAddress: text("companyAddress"),
  companyPhone: varchar("companyPhone", { length: 20 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  companyTaxCode: varchar("companyTaxCode", { length: 50 }),
  logo: text("logo"), // URL to logo
  invoiceTitle: varchar("invoiceTitle", { length: 255 }).default("Hóa Đơn Bán Hàng"),
  footer: text("footer"),
  headerColor: varchar("headerColor", { length: 20 }).default("#1e40af"),
  accentColor: varchar("accentColor", { length: 20 }).default("#3b82f6"),
  textColor: varchar("textColor", { length: 20 }).default("#111827"),
  bgColor: varchar("bgColor", { length: 20 }).default("#ffffff"),
  fontFamily: varchar("fontFamily", { length: 100 }).default("Arial"),
  showLogo: boolean("showLogo").default(true),
  showTaxCode: boolean("showTaxCode").default(true),
  showBankInfo: boolean("showBankInfo").default(false),
  bankInfo: text("bankInfo"),
  notes: text("notes"),
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
  publicNote: text("publicNote"),
  isRecurring: boolean("isRecurring").default(false),
  recurringInterval: mysqlEnum("recurringInterval", ["weekly", "monthly", "quarterly"]),
  recurringNextDate: timestamp("recurringNextDate"),
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
  logoUrl: text("logoUrl"),
  faviconUrl: text("faviconUrl"),
  emailNotifications: boolean("emailNotifications").default(true),
  invoiceReminder: boolean("invoiceReminder").default(true),
  reminderHoursBefore: int("reminderHoursBefore").default(24),
  paymentConfirmation: boolean("paymentConfirmation").default(true),
   weeklyReport: boolean("weeklyReport").default(false),
  weeklyReportEmail: varchar("weeklyReportEmail", { length: 320 }),
  telegramChatId: varchar("telegramChatId", { length: 100 }),
  telegramBotToken: varchar("telegramBotToken", { length: 200 }),
  telegramEnabled: boolean("telegramEnabled").default(false),
  thankYouTitle: varchar("thankYouTitle", { length: 255 }),
  thankYouMessage: text("thankYouMessage"),
  thankYouSocialLinks: json("thankYouSocialLinks"),
  thankYouBgFrom: varchar("thankYouBgFrom", { length: 50 }),
  thankYouBgTo: varchar("thankYouBgTo", { length: 50 }),
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

// Email Templates table
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["CREATED", "PAID", "SHIPPING", "WARRANTY", "REVIEW"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: mediumtext("htmlBody").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// Invoice Notes table (internal notes visible only to staff)
export const invoiceNotes = mysqlTable("invoiceNotes", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceNote = typeof invoiceNotes.$inferSelect;
export type InsertInvoiceNote = typeof invoiceNotes.$inferInsert;

// Reminder Logs table (track sent reminders)
export const reminderLogs = mysqlTable("reminderLogs", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  type: mysqlEnum("type", ["24h", "48h"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  success: boolean("success").default(true),
});

export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertReminderLog = typeof reminderLogs.$inferInsert;
// Email Campaigns table
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: mediumtext("htmlBody").notNull(),
  status: mysqlEnum("status", ["DRAFT", "SENDING", "SENT", "FAILED"]).default("DRAFT").notNull(),
  targetType: mysqlEnum("targetType", ["ALL", "PAID", "UNPAID", "CUSTOM"]).default("ALL").notNull(),
  totalRecipients: int("totalRecipients").default(0),
  sentCount: int("sentCount").default(0),
  failedCount: int("failedCount").default(0),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

// Email Campaign Recipients table
export const emailCampaignRecipients = mysqlTable("emailCampaignRecipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  customerId: int("customerId"),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["PENDING", "SENT", "FAILED"]).default("PENDING").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
});
export type EmailCampaignRecipient = typeof emailCampaignRecipients.$inferSelect;
export type InsertEmailCampaignRecipient = typeof emailCampaignRecipients.$inferInsert;
