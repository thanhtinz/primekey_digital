import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, products, invoices, invoiceItems, taxes, discountCodes, invoiceTemplates, paymentGatewaysConfig, auditLogs } from "../drizzle/schema";

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

// Create operations
export async function createInvoice(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(invoices).values({ userId, ...data });
}

export async function createCustomer(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customers).values({ userId, ...data });
}

export async function createProduct(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values({ userId, ...data });
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

export async function createInvoiceTemplate(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(invoiceTemplates).values({ userId, ...data });
}

export async function createPaymentGatewayConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(paymentGatewaysConfig).values(data);
}

// Update operations
export async function updateInvoice(userId: number, id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function updateCustomer(userId: number, id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(eq(customers.id, id));
}

export async function updateProduct(userId: number, id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function updateInvoiceTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(invoiceTemplates).set(data).where(eq(invoiceTemplates.id, id));
}

export async function updatePaymentGatewayConfig(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(paymentGatewaysConfig).set(data).where(eq(paymentGatewaysConfig.id, id));
}

// Delete operations
export async function deleteInvoice(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoices).where(eq(invoices.id, id));
}

export async function deleteCustomer(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(customers).where(eq(customers.id, id));
}

export async function deleteProduct(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(eq(products.id, id));
}

export async function deleteInvoiceItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoiceItems).where(eq(invoiceItems.id, id));
}

export async function deleteInvoiceTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoiceTemplates).where(eq(invoiceTemplates.id, id));
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

// Dashboard stats
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalInvoices: 0, paidInvoices: 0, pendingInvoices: 0 };
  
  const userInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
  const totalRevenue = userInvoices.reduce((sum, inv) => sum + (typeof inv.totalAmount === 'number' ? inv.totalAmount : 0), 0);
  const paidInvoices = userInvoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoices = userInvoices.filter(inv => inv.status === 'PENDING').length;
  
  return {
    totalRevenue,
    totalInvoices: userInvoices.length,
    paidInvoices,
    pendingInvoices,
  };
}
