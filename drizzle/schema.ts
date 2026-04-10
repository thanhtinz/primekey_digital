import { decimal, int, bigint, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, mediumtext, tinyint } from "drizzle-orm/mysql-core";

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
  passwordHash: varchar("passwordHash", { length: 255 }), // bcrypt hash, null = email-only login
  emailVerified: boolean("emailVerified").default(false),
  walletBalance: decimal("walletBalance", { precision: 15, scale: 2 }).default("0"), // số dư ví
  emailVerificationToken: varchar("emailVerificationToken", { length: 128 }), // token xác minh email
  resetPasswordToken: varchar("resetPasswordToken", { length: 128 }), // token đặt lại mật khẩu
  resetPasswordExpires: timestamp("resetPasswordExpires"), // hết hạn token
  loginAttempts: int("loginAttempts").default(0), // số lần đăng nhập sai
  lockedUntil: timestamp("lockedUntil"), // khóa tài khoản tạm thời
  lastLoginAt: timestamp("lastLoginAt"), // lần đăng nhập cuối
  totpSecret: varchar("totpSecret", { length: 64 }), // TOTP secret for 2FA
  totpEnabled: boolean("totpEnabled").default(false), // 2FA enabled
  avatarUrl: text("avatarUrl"), // Avatar URL stored persistently
  customerRole: mysqlEnum("customerRole", ["customer", "vip", "wholesale", "partner"]).default("customer"),
  // Notification preferences
  notifyOnLogin: boolean("notifyOnLogin").default(false),
  notifyNewProduct: boolean("notifyNewProduct").default(false),
  notifyFlashSale: boolean("notifyFlashSale").default(false),
  notifyPromotion: boolean("notifyPromotion").default(true),
  notifyOrderStatus: boolean("notifyOrderStatus").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Customer = typeof customers.$inferSelect;;
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
  inventoryType: mysqlEnum("inventoryType", ["manual", "warehouse"]).default("manual").notNull(),
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
  price: decimal("price", { precision: 15, scale: 2 }).notNull(), // Giá khách thường
  originalPrice: decimal("originalPrice", { precision: 15, scale: 2 }), // Giá gốc (nếu có giảm giá)
  priceVip: decimal("priceVip", { precision: 15, scale: 2 }), // Giá VIP
  priceWholesale: decimal("priceWholesale", { precision: 15, scale: 2 }), // Giá Đại Lý
  pricePartner: decimal("pricePartner", { precision: 15, scale: 2 }), // Giá Đối Tác
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
  status: mysqlEnum("status", ["CREATED", "PAID", "SHIPPING", "COMPLETED", "WARRANTY", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"]).default("CREATED"),
  reviewToken: varchar("reviewToken", { length: 64 }),
  reviewSubmitted: boolean("reviewSubmitted").default(false),
  paymentMethod: mysqlEnum("paymentMethod", ["PAYOS", "PAYPAL", "BANK_TRANSFER", "CASH"]),
  paymentUrl: text("paymentUrl"),
  qrCode: text("qrCode"),
  paymentTransactionId: varchar("paymentTransactionId", { length: 100 }),
  payosOrderCode: varchar("payosOrderCode", { length: 50 }), // PayOS numeric orderCode for webhook matching
  paidAt: timestamp("paidAt"),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  orderInfo: text("orderInfo"), // JSON: custom field values
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
  productReviewToken: varchar("productReviewToken", { length: 64 }), // per-product review token
  productReviewSubmitted: boolean("productReviewSubmitted").default(false),
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
  // General settings
  siteTitle: varchar("siteTitle", { length: 255 }),
  siteDescription: text("siteDescription"),
  siteKeywords: text("siteKeywords"),
  siteAuthor: varchar("siteAuthor", { length: 255 }),
  siteTimezone: varchar("siteTimezone", { length: 100 }),
  hotline: varchar("hotline", { length: 50 }),
  fanpageUrl: varchar("fanpageUrl", { length: 500 }),
  copyrightFooter: varchar("copyrightFooter", { length: 500 }),
  maintenanceMode: boolean("maintenanceMode").default(false),
  autoUpdate: boolean("autoUpdate").default(false),
  debugMode: boolean("debugMode").default(false),
  debugAutoBank: boolean("debugAutoBank").default(false),
  debugApiSuppliers: boolean("debugApiSuppliers").default(false),
  fontFamily: varchar("fontFamily", { length: 100 }),
  showApiDocs: boolean("showApiDocs").default(true),
  showAvatar: boolean("showAvatar").default(true),
  showTelegramReminder: boolean("showTelegramReminder").default(false),
  showSlider: boolean("showSlider").default(true),
  showBanner: boolean("showBanner").default(true),
  showRecentlyViewed: boolean("showRecentlyViewed").default(true),
  headerScript: text("headerScript"),
  footerScript: text("footerScript"),
  adminFooterScript: text("adminFooterScript"),
  // Brand colors
  themeColor: varchar("themeColor", { length: 20 }),
  themeColor1: varchar("themeColor1", { length: 20 }),
  // Extra brand assets
  logoDarkUrl: text("logoDarkUrl"),
  siteImageUrl: text("siteImageUrl"),
  avatarImageUrl: text("avatarImageUrl"),
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
  productId: int("productId"), // null = apply to all products
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
  avatarUrl: text("avatarUrl"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  isAdminSession: boolean("isAdminSession").default(false), // true if logged in as admin user
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

// ─── Wallet Transactions - lịch sử nạp/trừ số dư ví ────────────────────────
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  type: mysqlEnum("wt_type", ["topup", "spend", "refund", "reward"]).notNull(), // nạp, chi tiêu, hoàn tiền, thưởng
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 15, scale: 2 }).default("0"),
  balanceAfter: decimal("balanceAfter", { precision: 15, scale: 2 }).default("0"),
  description: varchar("description", { length: 500 }),
  invoiceId: int("invoiceId"), // liên kết đơn hàng nếu có
  payosOrderCode: bigint("payosOrderCode", { mode: "number" }), // mã đơn PayOS nạp tiền
  status: mysqlEnum("wt_status", ["pending", "completed", "failed"]).default("completed"),
  createdAt: timestamp("createdAt_wt").defaultNow().notNull(),
});
export type WalletTransaction = typeof walletTransactions.$inferSelect;

// ─── Customer Notifications ─────────────────────────────────────────────────
export const customerNotifications = mysqlTable("customer_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner (admin)
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("cn_type", ["info", "success", "warning", "order", "payment", "promo"]).default("info"),
  isRead: boolean("isRead").default(false),
  link: varchar("link", { length: 500 }), // optional deep link
  createdAt: timestamp("cn_createdAt").defaultNow().notNull(),
});
export type CustomerNotification = typeof customerNotifications.$inferSelect;

// ─── Support Tickets ─────────────────────────────────────────────────────────
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner (admin)
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: mysqlEnum("ticket_priority", ["low", "medium", "high"]).default("medium"),
  adminReply: text("adminReply"),
  repliedAt: timestamp("repliedAt"),
  invoiceId: int("invoiceId"), // optional related invoice
  createdAt: timestamp("ticket_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("ticket_updatedAt").defaultNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;

// ─── Banners - banner trang chủ ─────────────────────────────────────────────
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }), // link khi click banner
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt_bn").defaultNow().notNull(),
});
export type Banner = typeof banners.$inferSelect;

// ─── Tax Settings - cấu hình thuế ────────────────────────────────────────────
export const taxSettings = mysqlTable("tax_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taxName: varchar("taxName", { length: 100 }).default("VAT"), // tên loại thuế
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0"), // % thuế (0-100)
  isEnabled: boolean("isEnabled").default(false),
  applyTo: mysqlEnum("apply_to", ["all", "specific"]).default("all"), // áp dụng cho tất cả hay SP cụ thể
  createdAt: timestamp("createdAt_ts").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_ts").defaultNow().onUpdateNow().notNull(),
});
export type TaxSetting = typeof taxSettings.$inferSelect;

// ─── Loyalty Rewards - phần thưởng đổi điểm ─────────────────────────────────
export const loyaltyRewards = mysqlTable("loyalty_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  pointsCost: int("pointsCost").notNull(), // số điểm cần để đổi
  rewardType: mysqlEnum("reward_type", ["discount_code", "wallet_credit", "physical", "custom"]).default("discount_code"),
  rewardValue: decimal("rewardValue", { precision: 15, scale: 2 }).default("0"), // giá trị phần thưởng
  stock: int("stock").default(-1), // -1 = unlimited
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt_lr").defaultNow().notNull(),
});
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;

// ─── Loyalty Reward Redemptions - lịch sử đổi thưởng ─────────────────────────
export const loyaltyRedemptions = mysqlTable("loyalty_redemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  pointsUsed: int("pointsUsed").notNull(),
  status: mysqlEnum("redemption_status", ["pending", "fulfilled", "cancelled"]).default("pending"),
  couponCode: varchar("couponCode", { length: 50 }), // nếu reward là coupon
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt_lrd").defaultNow().notNull(),
});
export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;

// ─── Spin Wheel Items - các ô trong vòng quay ─────────────────────────────────
export const spinWheelItems = mysqlTable("spin_wheel_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(), // tên hiển thị
  prizeType: mysqlEnum("prize_type", ["points", "wallet_credit", "coupon", "nothing"]).default("points"),
  prizeValue: decimal("prizeValue", { precision: 15, scale: 2 }).default("0"),
  probability: decimal("probability", { precision: 5, scale: 2 }).default("10"), // % xác suất (tổng = 100)
  color: varchar("color", { length: 20 }).default("#4F46E5"), // màu ô
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
});
export type SpinWheelItem = typeof spinWheelItems.$inferSelect;

// ─── Spin Wheel Config - cấu hình vòng quay ───────────────────────────────────
export const spinWheelConfig = mysqlTable("spin_wheel_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isEnabled: boolean("isEnabled").default(false),
  pointsPerSpin: int("pointsPerSpin").default(50), // điểm cần để quay
  spinsPerDay: int("spinsPerDay").default(1), // số lần quay tối đa/ngày
  updatedAt: timestamp("updatedAt_swc").defaultNow().onUpdateNow().notNull(),
});
export type SpinWheelConfig = typeof spinWheelConfig.$inferSelect;

// ─── Spin History - lịch sử quay ─────────────────────────────────────────────
export const spinHistory = mysqlTable("spin_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  spinWheelItemId: int("spinWheelItemId").notNull(),
  prizeType: varchar("prizeType", { length: 50 }),
  prizeValue: decimal("prizeValue", { precision: 15, scale: 2 }).default("0"),
  pointsUsed: int("pointsUsed").default(0),
  createdAt: timestamp("createdAt_sh").defaultNow().notNull(),
});
export type SpinHistoryItem = typeof spinHistory.$inferSelect;

// ─── Referral Withdrawals - yêu cầu rút thưởng giới thiệu ────────────────────
export const referralWithdrawals = mysqlTable("referral_withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  withdrawType: mysqlEnum("withdraw_type", ["atm", "wallet"]).notNull(), // rút về ATM hoặc về ví
  bankName: varchar("bankName", { length: 100 }), // tên ngân hàng (nếu ATM)
  bankAccount: varchar("bankAccount", { length: 50 }), // số tài khoản (nếu ATM)
  bankHolder: varchar("bankHolder", { length: 255 }), // tên chủ tài khoản (nếu ATM)
  status: mysqlEnum("withdraw_status", ["pending", "processing", "completed", "rejected"]).default("pending"),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt_rw").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_rw").defaultNow().onUpdateNow().notNull(),
});
export type ReferralWithdrawal = typeof referralWithdrawals.$inferSelect;

// ─── Product Tags ─────────────────────────────────────────────────────────────
export const productTags = mysqlTable("product_tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#3b82f6"), // hex color for badge
  icon: varchar("icon", { length: 50 }), // emoji or icon identifier
  createdAt: timestamp("createdAt_pt").defaultNow().notNull(),
});
export type ProductTag = typeof productTags.$inferSelect;
export type InsertProductTag = typeof productTags.$inferInsert;

// ─── Product Tag Mappings ─────────────────────────────────────────────────────
export const productTagMappings = mysqlTable("product_tag_mappings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  tagId: int("tagId").notNull(),
});
export type ProductTagMapping = typeof productTagMappings.$inferSelect;

// ─── Site Announcements (popup/banner notifications) ─────────────────────────
export const siteAnnouncements = mysqlTable("site_announcements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("sa_type", ["info", "success", "warning", "error"]).default("info"),
  isActive: boolean("isActive").default(true),
  showAsPopup: boolean("showAsPopup").default(false),
  startAt: timestamp("startAt").notNull().defaultNow(),
  endAt: timestamp("endAt"),
  createdAt: timestamp("createdAt_sa").defaultNow().notNull(),
});
export type SiteAnnouncement = typeof siteAnnouncements.$inferSelect;

// ─── Blog ─────────────────────────────────────────────────────────────────────
export const blogCategories = mysqlTable("blog_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt_bc").defaultNow().notNull(),
});
export type BlogCategory = typeof blogCategories.$inferSelect;

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 500 }),
  isPublished: boolean("isPublished").default(false),
  publishedAt: timestamp("publishedAt"),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt_bp").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt_bp").defaultNow().onUpdateNow().notNull(),
});
export type BlogPost = typeof blogPosts.$inferSelect;

// ─── Feature Flags - bật/tắt tính năng client ────────────────────────────────
export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true).notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  updatedAt: timestamp("updatedAt_ff").defaultNow().onUpdateNow().notNull(),
});
export type FeatureFlag = typeof featureFlags.$inferSelect;

// ─── Phase 16: Login History & Security ──────────────────────────────────────
export const loginHistory = mysqlTable("login_history", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  deviceInfo: varchar("deviceInfo", { length: 255 }), // e.g. "Chrome on Windows"
  status: varchar("status", { length: 20 }).notNull().default("success"), // "success" | "failed"
  failReason: varchar("failReason", { length: 255 }),
  sessionToken: varchar("sessionToken", { length: 128 }), // link to customer_sessions.token
  createdAt: timestamp("createdAt_lh").defaultNow().notNull(),
});
export type LoginHistory = typeof loginHistory.$inferSelect;

// ─── Avatar Images - Kho ảnh avatar ──────────────────────────────────────────
export const avatarImages = mysqlTable("avatar_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // admin owner
  url: varchar("url", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  label: varchar("label", { length: 100 }),
  category: varchar("category", { length: 50 }).default("default"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt_ai").defaultNow().notNull(),
});
export type AvatarImage = typeof avatarImages.$inferSelect;

// ─── Automations - tự động hoá công việc ─────────────────────────────────────
export const automations = mysqlTable("automations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  jobType: varchar("jobType", { length: 100 }).notNull(), // "delete_orders" | "delete_wallet_history" | "delete_inactive_users" | "delete_telegram_logs" | "clean_images" | "revenue_report_telegram"
  intervalSeconds: bigint("intervalSeconds", { mode: "number" }).notNull().default(86400), // default 1 day
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  runCount: int("runCount").default(0),
  createdAt: timestamp("createdAt_auto").defaultNow().notNull(),
});
export type Automation = typeof automations.$inferSelect;

// ─── Blocked IPs - danh sách IP bị chặn ──────────────────────────────────────
export const blockedIps = mysqlTable("blocked_ips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  blockedAt: timestamp("blockedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // null = permanent
  isActive: boolean("isActive").default(true).notNull(),
});
export type BlockedIp = typeof blockedIps.$inferSelect;

// ─── Image Library - thư viện ảnh ────────────────────────────────────────────
export const imageFolders = mysqlTable("image_folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: int("parentId"), // null = root folder
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ImageFolder = typeof imageFolders.$inferSelect;
export type InsertImageFolder = typeof imageFolders.$inferInsert;

export const imageFiles = mysqlTable("image_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  folderId: int("folderId"), // null = root
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  size: int("size").notNull(), // bytes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ImageFile = typeof imageFiles.$inferSelect;
export type InsertImageFile = typeof imageFiles.$inferInsert;

// ─── Referral Commissions - nhật ký hoa hồng ─────────────────────────────────
export const referralCommissions = mysqlTable("referral_commissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  referrerId: int("referrerId").notNull(), // customer who referred
  referredCustomerId: int("referredCustomerId").notNull(), // customer who was referred
  invoiceId: int("invoiceId"), // order that triggered commission
  commissionAmount: decimal("commissionAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReferralCommission = typeof referralCommissions.$inferSelect;
export type InsertReferralCommission = typeof referralCommissions.$inferInsert;

// ─── Static Pages ─────────────────────────────────────────────────────────────
export const staticPages = mysqlTable("static_pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  isPublished: tinyint("isPublished").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaticPage = typeof staticPages.$inferSelect;
export type InsertStaticPage = typeof staticPages.$inferInsert;

// ─── Menu Items ───────────────────────────────────────────────────────────────
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  target: mysqlEnum("target", ["_self", "_blank"]).default("_self").notNull(),
  order: int("order").default(0).notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

// ─── Product Inventory ────────────────────────────────────────────────────────
export const productInventory = mysqlTable("product_inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  packageId: int("packageId"),
  stockData: text("stockData").notNull(), // JSON array of stock items
  status: mysqlEnum("status", ["available", "used", "reserved"]).default("available").notNull(),
  assignedOrderId: int("assignedOrderId"),
  assignedAt: timestamp("assignedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductInventoryItem = typeof productInventory.$inferSelect;
export type InsertProductInventoryItem = typeof productInventory.$inferInsert;
