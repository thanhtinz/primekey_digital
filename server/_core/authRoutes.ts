import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as authService from "../auth";
import { getSessionCookieOptions } from "./cookies";
import { SignJWT } from "jose";
import { ENV } from "./env";

const secret = new TextEncoder().encode(ENV.jwtSecret);

async function createSessionToken(userId: number, expiresInMs: number = ONE_YEAR_MS) {
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(secret);
  
  return token;
}

export function registerAuthRoutes(app: Express) {
  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await authService.loginUser(email, password);

      const sessionToken = await createSessionToken(user.id, ONE_YEAR_MS);
      const cookieOptions = getSessionCookieOptions(req);
      
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Register route (optional, for now we'll skip it)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await authService.registerUser(email, password, name);
      res.json({ success: true, user });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
