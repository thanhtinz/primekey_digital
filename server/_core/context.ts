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
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) {
      return null;
    }

    const secret = new TextEncoder().encode(ENV.jwtSecret);
    const verified = await jwtVerify(sessionCookie, secret);
    
    const userId = (verified.payload as any).userId;
    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    return user || null;
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
