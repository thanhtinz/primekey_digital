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
  avatarUrl: text("avatarUrl"),
  referralCode: varchar("referralCode", { length: 50 }),
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

// Product Categories table - danh mục 2 cấp (lớn và nhỏ)
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 100 }), // Tên icon hoặc emoji
  parentId: int("parentId"), // null = danh mục lớn, có giá trị = danh mục nhỏ
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // legacy text category
  categoryId: int("categoryId"), // FK to productCategories (danh mục nhỏ)
  price: decimal("price", { precision: 15, scale: 2 }).default("0"), // legacy, giá nay nằm trong packages
  taxId: int("taxId"),
  warrantyMonths: int("warrantyMonths").default(0), // legacy, bảo hành nay nằm trong packages
  imageUrl: text("imageUrl"),
  notes: text("notes"),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product Packages table - các gói khác nhau của một sản phẩm
export const productPackages = mysqlTable("product_packages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Tên gói: "1 tháng", "3 tháng", "1 năm"
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 15, scale: 2 }), // Giá gốc (nếu có giảm giá)
  description: text("description"), // Mô tả ngắn về gói
  warrantyMonths: int("warrantyMonths").default(0), // Thời hạn bảo hành theo gói
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductPackage = typeof productPackages.$inferSelect;
export type InsertProductPackage = typeof productPackages.$inferInsert;

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
  warrantyStartDate: timestamp("warrantyStartDate"), // Ngày bắt đầu bảo hành
  warrantyExpiryDate: timestamp("warrantyExpiryDate"), // Ngày hết hạn bảo hành
  warrantyMonths: int("warrantyMonths").default(0), // Số tháng bảo hành
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
  thankYouBannerUrl: text("thankYouBannerUrl"),
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

// Warranty Claims table
export const warranties = mysqlTable("warranties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // shop owner
  invoiceId: int("invoiceId").notNull(),
  customerId: int("customerId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  productNames: text("productNames"), // comma separated
  reason: text("reason"),
  status: mysqlEnum("status", ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]).default("PENDING").notNull(),
  resolution: text("resolution"),
  warrantyStartDate: timestamp("warrantyStartDate"),
  warrantyExpiryDate: timestamp("warrantyExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Warranty = typeof warranties.$inferSelect;
export type InsertWarranty = typeof warranties.$inferInsert;

// Warranty Settings table
export const warrantySettings = mysqlTable("warrantySettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultMonths: int("defaultMonths").default(12),
  termsAndConditions: text("termsAndConditions"),
  contactInfo: text("contactInfo"),
  autoActivateOnPaid: boolean("autoActivateOnPaid").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WarrantySettings = typeof warrantySettings.$inferSelect;
export type InsertWarrantySettings = typeof warrantySettings.$inferInsert;

// Flash Sales table
export const flashSales = mysqlTable("flashSales", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 15, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }).notNull(),
  discountPercent: int("discountPercent").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  maxQuantity: int("maxQuantity").default(0), // 0 = unlimited
  soldQuantity: int("soldQuantity").default(0),
  isActive: boolean("isActive").default(true),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FlashSale = typeof flashSales.$inferSelect;
export type InsertFlashSale = typeof flashSales.$inferInsert;


// Coupons table
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).notNull().default("percent"),
  discountValue: decimal("discountValue", { precision: 15, scale: 2 }).notNull(), // % or VND
  minOrderAmount: decimal("minOrderAmount", { precision: 15, scale: 2 }).default("0"),
  maxDiscountAmount: decimal("maxDiscountAmount", { precision: 15, scale: 2 }), // cap for percent type
  maxUses: int("maxUses").default(0), // 0 = unlimited
  usedCount: int("usedCount").default(0),
  maxUsesPerCustomer: int("maxUsesPerCustomer").default(1),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// Coupon usages tracking
export const couponUsages = mysqlTable("coupon_usages", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  discountAmount: decimal("discountAmount", { precision: 15, scale: 2 }).notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});
export type CouponUsage = typeof couponUsages.$inferSelect;


// ─── Batch 6: 10 New Features ────────────────────────────────────────────────


// 2. Loyalty Points
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  points: int("points").notNull(), // positive = earned, negative = redeemed
  reason: varchar("reason", { length: 255 }).notNull(), // "EARNED_ORDER", "REDEEMED", "MANUAL"
  invoiceId: int("invoiceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;

export const loyaltySettings = mysqlTable("loyalty_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  pointsPerAmount: int("pointsPerAmount").default(1000), // 1000 VND = 1 point
  redeemRate: int("redeemRate").default(100), // 100 points = 1000 VND discount
  isEnabled: boolean("isEnabled").default(true),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LoyaltySetting = typeof loyaltySettings.$inferSelect;

// 3. Warranty Requests
export const warrantyRequests = mysqlTable("warranty_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  warrantyId: int("warrantyId"),
  invoiceCode: varchar("invoiceCode", { length: 100 }),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  description: text("description").notNull(),
  imageUrls: text("imageUrls"), // JSON array of image URLs
  status: mysqlEnum("status", ["PENDING", "PROCESSING", "RESOLVED", "REJECTED"]).default("PENDING").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WarrantyRequest = typeof warrantyRequests.$inferSelect;

// 4. Flash Sale Subscribers
export const flashSaleSubscribers = mysqlTable("flash_sale_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  email: varchar("email", { length: 320 }).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
});
export type FlashSaleSubscriber = typeof flashSaleSubscribers.$inferSelect;

// 5. FAQ
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }).default("Chung"),
  sortOrder: int("sortOrder").default(0),
  isPublished: boolean("isPublished").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Faq = typeof faqs.$inferSelect;

// 6. Refunds
export const refunds = mysqlTable("refunds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "PROCESSED"]).default("PENDING").notNull(),
  adminNote: text("adminNote"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Refund = typeof refunds.$inferSelect;
// 7. VAT Invoices
export const vatInvoices = mysqlTable("vat_invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceId: int("invoiceId"),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  taxCode: varchar("taxCode", { length: 50 }).notNull(),
  companyAddress: text("companyAddress"),
  companyEmail: varchar("companyEmail", { length: 320 }),
  vatRate: int("vatRate").default(10),
  status: mysqlEnum("status_vat", ["PENDING", "ISSUED", "CANCELLED"]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt_vat").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_vat").defaultNow().onUpdateNow().notNull(),
});
export type VatInvoice = typeof vatInvoices.$inferSelect;

// ─── Customer Sessions (đăng nhập khách hàng bằng email) ─────────────────────
export const customerSessions = mysqlTable("customer_sessions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt_cs").defaultNow().notNull(),
});
export type CustomerSession = typeof customerSessions.$inferSelect;


// ─── Phase 13: Cart, Wishlist, Referral, Custom Fields ──────────────────────

// Cart Items - giỏ hàng
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  sessionEmail: varchar("sessionEmail", { length: 320 }).notNull(), // email khách hàng
  productId: int("productId").notNull(),
  packageId: int("packageId"), // gói sản phẩm (nếu có)
  quantity: int("quantity").default(1).notNull(),
  customFieldValues: text("customFieldValues"), // JSON string: [{fieldName, fieldValue}]
  createdAt: timestamp("createdAt_cart").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_cart").defaultNow().onUpdateNow().notNull(),
});
export type CartItem = typeof cartItems.$inferSelect;

// Wishlists - yêu thích sản phẩm
export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  sessionEmail: varchar("sessionEmail", { length: 320 }).notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt_wl").defaultNow().notNull(),
});
export type Wishlist = typeof wishlists.$inferSelect;

// Referral Settings - cấu hình hệ thống giới thiệu (admin)
export const referralSettings = mysqlTable("referral_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  isEnabled: boolean("isEnabled").default(false),
  rewardType: mysqlEnum("rewardType", ["percentage", "fixed", "points"]).default("fixed"),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }).default("0"), // số tiền/% thưởng
  minOrderAmount: decimal("minOrderAmount", { precision: 15, scale: 2 }).default("0"), // đơn tối thiểu
  description: text("description"), // mô tả chương trình
  createdAt: timestamp("createdAt_rs").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_rs").defaultNow().onUpdateNow().notNull(),
});
export type ReferralSetting = typeof referralSettings.$inferSelect;

// Referrals - lịch sử giới thiệu
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerEmail: varchar("referrerEmail", { length: 320 }).notNull(), // người giới thiệu
  refereeEmail: varchar("refereeEmail", { length: 320 }).notNull(), // người được giới thiệu
  referralCode: varchar("referralCode", { length: 50 }).notNull(),
  invoiceId: int("invoiceId"), // đơn hàng liên quan
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }).default("0"),
  status: mysqlEnum("status_ref", ["pending", "completed", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt_ref").defaultNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;

// Product Custom Fields - trường tùy chỉnh cho sản phẩm
export const productCustomFields = mysqlTable("product_custom_fields", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  fieldName: varchar("fieldName", { length: 255 }).notNull(),
  fieldValue: text("fieldValue"),
  sortOrder: int("sortOrder").default(0),
});
export type ProductCustomField = typeof productCustomFields.$inferSelect;

// Product Reviews - đánh giá theo sản phẩm
export const productReviews = mysqlTable("product_reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  invoiceId: int("invoiceId"), // đơn hàng liên quan (chứng minh đã mua)
  isApproved: boolean("isApproved").default(false),
  createdAt: timestamp("createdAt_pr").defaultNow().notNull(),
});
export type ProductReview = typeof productReviews.$inferSelect;

// Customer Referral Codes - mã giới thiệu của khách hàng
export const customerReferralCodes = mysqlTable("customer_referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  totalReferrals: int("totalReferrals").default(0),
  totalRewards: decimal("totalRewards", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt_crc").defaultNow().notNull(),
});
export type CustomerReferralCode = typeof customerReferralCodes.$inferSelect;
