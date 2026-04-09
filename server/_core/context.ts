import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { getUserById } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    // 1. Try JWT cookie (legacy admin login via /api/auth/login)
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];
    if (sessionCookie) {
      try {
        const secret = new TextEncoder().encode(ENV.jwtSecret);
        const verified = await jwtVerify(sessionCookie, secret);
        const userId = (verified.payload as any).userId;
        if (userId) {
          const user = await getUserById(userId);
          if (user) return user;
        }
      } catch {
        // JWT invalid, fall through to customer token check
      }
    }

    // 2. Try x-customer-token header (unified login via /client-login)
    const customerToken = req.headers["x-customer-token"] as string | undefined;
    if (customerToken) {
      const { getDb } = await import("../db");
      const { customerSessions, users } = await import("../../drizzle/schema");
      const { eq, and, gt } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const [session] = await db.select().from(customerSessions)
          .where(and(
            eq(customerSessions.token, customerToken),
            gt(customerSessions.expiresAt, new Date())
          ))
          .limit(1);
        if (session && (session as any).isAdminSession) {
          const [adminUser] = await db.select().from(users)
            .where(eq(users.email, session.email))
            .limit(1);
          if (adminUser) return adminUser;
        }
      }
    }

    return null;
  } catch (error) {
    // Invalid or expired token
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
