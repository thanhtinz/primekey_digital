/**
 * SSE (Server-Sent Events) manager for realtime Telegram link status updates.
 * When the Telegram bot confirms a link, it calls notifyTelegramLinked(email)
 * which pushes an event to all SSE clients listening for that email.
 */
import { Router, Request, Response } from "express";

const router = Router();

// Map: email → Set of SSE response objects
const sseClients = new Map<string, Set<Response>>();

/**
 * Called by telegram.ts after successfully linking a customer.
 * Pushes a "linked" event to all SSE clients subscribed to that email.
 */
export function notifyTelegramLinked(email: string, telegramUsername?: string | null | undefined) {
  const clients = sseClients.get(email);
  if (!clients || clients.size === 0) return;
  const payload = JSON.stringify({ linked: true, username: telegramUsername || null });
  Array.from(clients).forEach(res => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      // client disconnected
    }
  });
}

/**
 * Called by db.ts after removing a subscriber (admin action).
 * Pushes an "unlinked" event to all SSE clients subscribed to that email.
 */
export function notifyTelegramUnlinked(email: string) {
  const clients = sseClients.get(email);
  if (!clients || clients.size === 0) return;
  const payload = JSON.stringify({ linked: false, username: null });
  Array.from(clients).forEach(res => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      // client disconnected
    }
  });
}

// GET /api/sse/telegram-link?email=xxx&token=yyy
// Client subscribes to receive push events when Telegram link status changes
router.get("/telegram-link", (req: Request, res: Response) => {
  const email = (req.query.email as string || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "email required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  // Register client
  if (!sseClients.has(email)) {
    sseClients.set(email, new Set());
  }
  sseClients.get(email)!.add(res);

  // Send initial keepalive comment
  res.write(": connected\n\n");

  // Keepalive ping every 25s to prevent proxy timeout
  const keepalive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch (_) {
      clearInterval(keepalive);
    }
  }, 25_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(keepalive);
    sseClients.get(email)?.delete(res);
    if (sseClients.get(email)?.size === 0) {
      sseClients.delete(email);
    }
  });
});

export default router;
