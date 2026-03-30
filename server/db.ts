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

// TODO: add more feature queries here as your schema grows
