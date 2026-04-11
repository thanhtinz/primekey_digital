import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// import { registerOAuthRoutes } from "./oauth"; // Disabled: using email/password auth instead
import { registerAuthRoutes } from "./authRoutes";
import { appRouterFull } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import webhookRouter from "../webhooks";
import sseRouter from "../sse";
import { checkLicenseOnStartup, licenseMiddleware } from "../license";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── Trust Proxy (required for rate-limit + correct IP behind reverse proxy) ──
  app.set("trust proxy", 1);

  // ── Security Headers (helmet) ──
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow inline scripts/styles in SPA
    crossOriginEmbedderPolicy: false,
  }));

  // ── Rate Limiting ──
  // General API rate limit: 200 req/min per IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau" },
    skip: (req) => req.path.startsWith("/api/webhooks"), // Webhooks bypass rate limit
  });

  // Strict rate limit for auth endpoints: 20 req/min per IP
  const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Quá nhiều yêu cầu xác thực, vui lòng thử lại sau" },
  });

  app.use("/api/trpc", generalLimiter);
  app.use("/api/auth", strictLimiter);

  // ── Body Parser (reduced from 50MB to prevent DoS) ──
  // Allow up to 10MB for file uploads (base64 images)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // ── License Check ──
  // Apply license middleware to all API routes (skip webhooks + auth)
  app.use("/api/trpc", licenseMiddleware);

  // Auth routes (login, logout, register)
  registerAuthRoutes(app);
  // OAuth callback disabled: using email/password auth instead
  // registerOAuthRoutes(app);
  // Webhook routes
  app.use("/api/webhooks", webhookRouter);
  // SSE routes (realtime push events)
  app.use("/api/sse", sseRouter);
  // tRPC API - use the full router with all sub-routers
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouterFull,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Check license on startup (non-blocking)
  await checkLicenseOnStartup();
  // Start GitHub update polling (checks for new versions every hour)
  const { startUpdatePolling } = await import("../auto-update");
  startUpdatePolling();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
