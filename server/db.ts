import { eq, and, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, products, invoices, invoiceItems, taxes, discountCodes, invoiceTemplates, paymentGatewaysConfig, auditLogs, userSettings, reviews, smtpConfig, emailTemplates, emailCampaigns, emailCampaignRecipients, InsertEmailCampaign, InsertEmailCampaignRecipient } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User queries
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(user);
  return result;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Customer queries
export async function getCustomersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(customers).where(eq(customers.userId, userId));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getProductsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products).where(eq(products.userId, userId));
}

// Invoice queries
export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.userId, userId));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoiceByOrderCode(orderCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  // First try to find by payosOrderCode (numeric orderCode from PayOS webhook)
  const result = await db.select().from(invoices).where(eq((invoices as any).payosOrderCode, orderCode)).limit(1);
  if (result.length > 0) return result[0];
  // Fallback: try paymentTransactionId (old behavior)
  const result2 = await db.select().from(invoices).where(eq(invoices.paymentTransactionId, orderCode)).limit(1);
  return result2.length > 0 ? result2[0] : undefined;
}

// Invoice Items queries
export async function getInvoiceItemsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

// Tax queries
export async function getTaxesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(taxes).where(eq(taxes.userId, userId));
}

// Discount Code queries
export async function getDiscountCodesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(discountCodes).where(eq(discountCodes.userId, userId));
}

// Invoice Template queries
export async function getInvoiceTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoiceTemplates).where(eq(invoiceTemplates.userId, userId));
}

// Payment Gateway Config queries
export async function getPaymentGatewaysConfigByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(paymentGatewaysConfig).where(eq(paymentGatewaysConfig.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// TODO: add more feature queries here as your schema grows

// Create operations
export async function createCustomer(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customers).values(data);
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values(data);
}

export async function createInvoice(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(invoices).values(data);
}

export async function createInvoiceItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(invoiceItems).values(data);
}

export async function createTax(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(taxes).values(data);
}

export async function createDiscountCode(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(discountCodes).values(data);
}

export async function createInvoiceTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoiceTemplates).values(data);
  return result;
}

export async function createPaymentGatewayConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(paymentGatewaysConfig).values(data);
}

// Update operations
export async function updateCustomer(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(eq(customers.id, id));
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function updateInvoice(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function updatePaymentGatewayConfig(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(paymentGatewaysConfig).set(data).where(eq(paymentGatewaysConfig.id, id));
}

// Delete operations
export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(customers).where(eq(customers.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(eq(products.id, id));
}

export async function deleteInvoice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoices).where(eq(invoices.id, id));
}

export async function deleteInvoiceItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoiceItems).where(eq(invoiceItems.id, id));
}

// Audit log
export async function createAuditLog(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(auditLogs).values(data);
}

export async function getAuditLogsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId));
}

// Additional query helpers
export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvoiceTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvoiceTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(invoiceTemplates).set(data).where(eq(invoiceTemplates.id, id));
}

export async function deleteInvoiceTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoiceTemplates).where(eq(invoiceTemplates.id, id));
}

// User Settings queries
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(userId: number, data: Partial<typeof userSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSettings(userId);
  if (existing) {
    return db.update(userSettings).set({ ...data, updatedAt: new Date() }).where(eq(userSettings.userId, userId));
  } else {
    return db.insert(userSettings).values({ userId, ...data });
  }
}

// Get invoices by customer email (public - for order tracking)
export async function getInvoicesByCustomerEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  // Find customer by email first
  const customerList = await db.select().from(customers).where(eq(customers.email, email));
  if (customerList.length === 0) return [];
  const customerIds = customerList.map(c => c.id);
  // Get all invoices for these customers
  const allInvoices = [];
  for (const customerId of customerIds) {
    const invs = await db.select().from(invoices).where(eq(invoices.customerId, customerId));
    allInvoices.push(...invs);
  }
  return allInvoices;
}

// Reviews CRUD
export async function getReviewByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReviewByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.invoiceId, invoiceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublicReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(and(eq(reviews.isPublic, true), eq(reviews.isApproved, true)));
}

export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews);
}

export async function createReview(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(data);
}

export async function updateReview(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reviews).set(data).where(eq(reviews.id, id));
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(reviews).where(eq(reviews.id, id));
}

// Email Templates
export async function getEmailTemplateByType(userId: number, type: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates)
    .where(and(eq(emailTemplates.userId, userId), eq(emailTemplates.type, type as any)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getEmailTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
}
export async function upsertEmailTemplate(userId: number, type: string, data: { subject: string; htmlBody: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getEmailTemplateByType(userId, type);
  if (existing) {
    return db.update(emailTemplates).set({ ...data, updatedAt: new Date() })
      .where(and(eq(emailTemplates.userId, userId), eq(emailTemplates.type, type as any)));
  } else {
    return db.insert(emailTemplates).values({ userId, type: type as any, ...data });
  }
}

// SMTP Config
export async function getSmtpConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(smtpConfig).where(eq(smtpConfig.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSmtpConfig(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSmtpConfig(userId);
  if (existing) {
    return db.update(smtpConfig).set({ ...data, updatedAt: new Date() }).where(eq(smtpConfig.userId, userId));
  } else {
    return db.insert(smtpConfig).values({ userId, ...data });
  }
}

// Invoice Templates - unset all defaults for a user
export async function unsetAllDefaultTemplates(userId: number) {
  const db = await getDb();
  if (!db) return;
  return db.update(invoiceTemplates).set({ isDefault: false }).where(eq(invoiceTemplates.userId, userId));
}

// ─── Invoice Notes (internal) ─────────────────────────────────────────────────
export async function getInvoiceNotes(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  const { invoiceNotes, users } = await import("../drizzle/schema");
  return db.select({
    id: invoiceNotes.id,
    invoiceId: invoiceNotes.invoiceId,
    userId: invoiceNotes.userId,
    content: invoiceNotes.content,
    createdAt: invoiceNotes.createdAt,
    authorName: users.name,
  }).from(invoiceNotes)
    .leftJoin(users, eq(invoiceNotes.userId, users.id))
    .where(eq(invoiceNotes.invoiceId, invoiceId))
    .orderBy(invoiceNotes.createdAt);
}
export async function createInvoiceNote(invoiceId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { invoiceNotes } = await import("../drizzle/schema");
  return db.insert(invoiceNotes).values({ invoiceId, userId, content });
}
export async function deleteInvoiceNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { invoiceNotes } = await import("../drizzle/schema");
  return db.delete(invoiceNotes).where(eq(invoiceNotes.id, id));
}

// ─── Staff Management ─────────────────────────────────────────────────────────
export async function getAllStaff() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}
export async function createStaff(email: string, hashedPassword: string, name: string, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(users).values({ email, password: hashedPassword, name, role });
}
export async function updateStaffRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ role }).where(eq(users.id, id));
}
export async function updateStaffPassword(id: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
}
export async function deleteStaff(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(users).where(eq(users.id, id));
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export async function createActivityLog(userId: number, action: string, entityType: string, entityId?: number, changes?: any) {
  const db = await getDb();
  if (!db) return;
  return db.insert(auditLogs).values({ userId, action, entityType, entityId, changes });
}
export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: auditLogs.id,
    userId: auditLogs.userId,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    entityId: auditLogs.entityId,
    changes: auditLogs.changes,
    createdAt: auditLogs.createdAt,
    authorName: users.name,
    authorEmail: users.email,
  }).from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}

// ─── Reminder Logs ────────────────────────────────────────────────────────────
export async function hasReminderBeenSent(invoiceId: number, type: "24h" | "48h") {
  const db = await getDb();
  if (!db) return false;
  const { reminderLogs } = await import("../drizzle/schema");
  const result = await db.select().from(reminderLogs)
    .where(and(eq(reminderLogs.invoiceId, invoiceId), eq(reminderLogs.type, type)))
    .limit(1);
  return result.length > 0;
}
export async function createReminderLog(invoiceId: number, type: "24h" | "48h", success: boolean) {
  const db = await getDb();
  if (!db) return;
  const { reminderLogs } = await import("../drizzle/schema");
  return db.insert(reminderLogs).values({ invoiceId, type, success });
}
export async function getReminderLogs() {
  const { reminderLogs } = await import("../drizzle/schema");
  const drizzleDb = await getDb();
  if (!drizzleDb) return [];
  return drizzleDb.select().from(reminderLogs).orderBy(reminderLogs.sentAt).limit(100);
}

export async function getPendingInvoicesForReminder() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  // Get CREATED invoices older than 24h
  const { lt, gte } = await import("drizzle-orm");
  return db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    customerId: invoices.customerId,
    totalAmount: invoices.totalAmount,
    createdAt: invoices.createdAt,
    customerEmail: customers.email,
    customerName: customers.name,
  }).from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(
      eq(invoices.status, "CREATED"),
      lt(invoices.createdAt, h24ago),
    ));
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export async function getRevenueStats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { sql, gte } = await import("drizzle-orm");
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db.select({
    date: sql<string>`DATE(${invoices.createdAt})`,
    count: sql<number>`COUNT(*)`,
    revenue: sql<number>`SUM(CASE WHEN ${invoices.status} IN ('PAID','SHIPPING','WARRANTY') THEN ${invoices.totalAmount} ELSE 0 END)`,
  }).from(invoices)
    .where(and(eq(invoices.userId, userId), gte(invoices.createdAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(${invoices.createdAt})`)
    .orderBy(sql`DATE(${invoices.createdAt})`);
}
export async function getTopProducts(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const { sql, desc } = await import("drizzle-orm");
  return db.select({
    name: invoiceItems.name,
    totalQty: sql<number>`SUM(${invoiceItems.quantity})`,
    totalRevenue: sql<number>`SUM(${invoiceItems.totalAmount})`,
  }).from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(eq(invoices.userId, userId))
    .groupBy(invoiceItems.name)
    .orderBy(desc(sql`SUM(${invoiceItems.totalAmount})`))
    .limit(limit);
}
export async function getCustomerStats(userId: number, customerId: number) {
  const db = await getDb();
  if (!db) return null;
  const { sql, count, desc } = await import("drizzle-orm");
  const stats = await db.select({
    totalOrders: sql<number>`COUNT(*)`,
    totalSpent: sql<number>`SUM(${invoices.totalAmount})`,
    paidOrders: sql<number>`SUM(CASE WHEN ${invoices.status} IN ('PAID','SHIPPING','WARRANTY') THEN 1 ELSE 0 END)`,
  }).from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.customerId, customerId)));
  return stats[0] || null;
}

export async function getAllPaymentGatewaysConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentGatewaysConfig);
}

export async function getTopProductsDaily(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  const { sql, asc } = await import("drizzle-orm");
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return db.select({
    name: invoiceItems.name,
    totalQty: sql<number>`SUM(${invoiceItems.quantity})`,
    totalRevenue: sql<number>`SUM(${invoiceItems.totalAmount})`,
    orderCount: sql<number>`COUNT(DISTINCT ${invoiceItems.invoiceId})`,
  }).from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(and(
      eq(invoices.userId, userId),
      sql`DATE(${invoices.createdAt}) = ${targetDate}`,
    ))
    .groupBy(invoiceItems.name)
    .orderBy(asc(sql`SUM(${invoiceItems.totalAmount})`));
}

export async function getTopCustomersByPeriod(userId: number, days: number) {
  const db = await getDb();
  if (!db) return [];
  const { sql, desc, gte } = await import("drizzle-orm");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db.select({
    customerId: invoices.customerId,
    customerName: customers.name,
    customerEmail: customers.email,
    orderCount: sql<number>`COUNT(*)`,
    totalSpent: sql<number>`SUM(${invoices.totalAmount})`,
    paidCount: sql<number>`SUM(CASE WHEN ${invoices.status} IN ('PAID','SHIPPING','WARRANTY') THEN 1 ELSE 0 END)`,
  }).from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(
      eq(invoices.userId, userId),
      gte(invoices.createdAt, since),
    ))
    .groupBy(invoices.customerId, customers.name, customers.email)
    .orderBy(desc(sql`SUM(${invoices.totalAmount})`))
    .limit(20);
}

// ─── Email Campaigns ─────────────────────────────────────────────────────────
export async function createEmailCampaign(data: InsertEmailCampaign) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(emailCampaigns).values(data);
  return result.insertId as number;
}

export async function getEmailCampaignsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { desc } = await import("drizzle-orm");
  return db.select().from(emailCampaigns).where(eq(emailCampaigns.userId, userId)).orderBy(desc(emailCampaigns.createdAt));
}

export async function getEmailCampaignById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  return rows[0] || null;
}

export async function updateEmailCampaign(id: number, data: Partial<InsertEmailCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id));
}

export async function deleteEmailCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(emailCampaignRecipients).where(eq(emailCampaignRecipients.campaignId, id));
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}

export async function createEmailCampaignRecipients(recipients: InsertEmailCampaignRecipient[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (recipients.length === 0) return;
  await db.insert(emailCampaignRecipients).values(recipients);
}

export async function getEmailCampaignRecipients(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailCampaignRecipients).where(eq(emailCampaignRecipients.campaignId, campaignId));
}

export async function updateEmailCampaignRecipient(id: number, data: Partial<InsertEmailCampaignRecipient>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(emailCampaignRecipients).set(data).where(eq(emailCampaignRecipients.id, id));
}

// Delete all items of an invoice (used when editing invoice)
export async function deleteInvoiceItemsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
}

// Search invoices by product name (for filter in InvoiceHistory)
export async function searchInvoicesByProduct(userId: number, productName: string) {
  const db = await getDb();
  if (!db) return [];
  // Find invoice IDs that have items matching the product name
  const matchingItems = await db.select({ invoiceId: invoiceItems.invoiceId })
    .from(invoiceItems)
    .where(like(invoiceItems.name, `%${productName}%`));
  if (matchingItems.length === 0) return [];
  const invoiceIds = Array.from(new Set(matchingItems.map(i => i.invoiceId)));
  return db.select().from(invoices)
    .where(and(eq(invoices.userId, userId), inArray(invoices.id, invoiceIds)));
}

// Get invoices with customer name (JOIN customers) for InvoiceHistory
export async function getInvoicesByUserIdWithCustomer(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: invoices.id,
    userId: invoices.userId,
    invoiceNumber: invoices.invoiceNumber,
    customerId: invoices.customerId,
    customerName: customers.name,
    customerEmail: customers.email,
    templateId: invoices.templateId,
    currency: invoices.currency,
    subtotal: invoices.subtotal,
    discountAmount: invoices.discountAmount,
    taxAmount: invoices.taxAmount,
    totalAmount: invoices.totalAmount,
    status: invoices.status,
    paymentMethod: invoices.paymentMethod,
    paymentUrl: invoices.paymentUrl,
    qrCode: invoices.qrCode,
    paymentTransactionId: invoices.paymentTransactionId,
    paidAt: invoices.paidAt,
    expiresAt: invoices.expiresAt,
    notes: invoices.notes,
    createdAt: invoices.createdAt,
    updatedAt: invoices.updatedAt,
  }).from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.userId, userId));
}

// ─── Telegram Bot Config helpers ──────────────────────────────────────────────
export async function getTelegramBotConfig(userId: number, botType: "admin" | "user") {
  const db = await getDb();
  if (!db) return null;
  const { telegramBotConfig } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  const rows = await db.select().from(telegramBotConfig)
    .where(and(eq(telegramBotConfig.userId, userId), eq(telegramBotConfig.botType, botType)));
  return rows[0] || null;
}

export async function upsertTelegramBotConfig(userId: number, botType: "admin" | "user", data: any) {
  const db = await getDb();
  if (!db) return null;
  const { telegramBotConfig } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  const existing = await getTelegramBotConfig(userId, botType);
  if (existing) {
    await db.update(telegramBotConfig).set({ ...data, updatedAt: new Date() })
      .where(and(eq(telegramBotConfig.userId, userId), eq(telegramBotConfig.botType, botType)));
    return getTelegramBotConfig(userId, botType);
  } else {
    await db.insert(telegramBotConfig).values({ userId, botType, ...data });
    return getTelegramBotConfig(userId, botType);
  }
}

export async function getTelegramSubscribers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { telegramSubscribers } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  return db.select().from(telegramSubscribers).where(eq(telegramSubscribers.userId, userId));
}

export async function upsertTelegramSubscriber(userId: number, customerId: number, chatId: string, data: any) {
  const db = await getDb();
  if (!db) return null;
  const { telegramSubscribers } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  const rows = await db.select().from(telegramSubscribers)
    .where(and(eq(telegramSubscribers.userId, userId), eq(telegramSubscribers.chatId, chatId)));
  if (rows[0]) {
    await db.update(telegramSubscribers).set({ ...data, lastInteraction: new Date() })
      .where(and(eq(telegramSubscribers.userId, userId), eq(telegramSubscribers.chatId, chatId)));
  } else {
    await db.insert(telegramSubscribers).values({ userId, customerId, chatId, ...data });
  }
}

export async function removeTelegramSubscriber(userId: number, subscriberId: number) {
  const db = await getDb();
  if (!db) return;
  const { telegramSubscribers } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  await db.delete(telegramSubscribers)
    .where(and(eq(telegramSubscribers.userId, userId), eq(telegramSubscribers.id, subscriberId)));
}

export async function getTelegramSubscriberByChatId(userId: number, chatId: string) {
  const db = await getDb();
  if (!db) return null;
  const { telegramSubscribers } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  const rows = await db.select().from(telegramSubscribers)
    .where(and(eq(telegramSubscribers.userId, userId), eq(telegramSubscribers.chatId, chatId)));
  return rows[0] || null;
}
