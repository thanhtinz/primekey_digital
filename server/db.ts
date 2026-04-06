import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, products, invoices, invoiceItems, taxes, discountCodes, invoiceTemplates, paymentGatewaysConfig, auditLogs, userSettings, reviews, smtpConfig, emailTemplates } from "../drizzle/schema";

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
