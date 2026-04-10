/**
 * Telegram Bot Service
 * Handles sending messages via Admin Bot and User Bot
 */
import * as db from "./db";

// ─── Core send function ───────────────────────────────────────────────────────
export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

// ─── Get bot info from Telegram ───────────────────────────────────────────────
export async function getBotInfo(botToken: string): Promise<{ ok: boolean; username?: string; firstName?: string; id?: number }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;
    const res = await fetch(url);
    const data = await res.json() as any;
    if (data.ok) {
      return { ok: true, username: data.result.username, firstName: data.result.first_name, id: data.result.id };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ─── Set webhook for a bot ────────────────────────────────────────────────────
export async function setTelegramWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

// ─── Delete webhook ───────────────────────────────────────────────────────────
export async function deleteTelegramWebhook(botToken: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

// ─── Admin Bot Notifications ──────────────────────────────────────────────────
export async function notifyAdminNewOrder(userId: number, order: {
  id: number; orderCode: string; customerName: string; customerEmail: string;
  totalAmount: number; currency: string; productName?: string;
}): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "admin");
    if (!config?.enabled || !config.botToken || !config.chatId || !config.notifyNewOrder) return;
    const amount = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
    const msg = `🛒 <b>ĐƠN HÀNG MỚI</b>\n\n` +
      `📋 Mã đơn: <code>${order.orderCode}</code>\n` +
      `👤 Khách: ${order.customerName}\n` +
      `📧 Email: ${order.customerEmail}\n` +
      (order.productName ? `📦 Sản phẩm: ${order.productName}\n` : "") +
      `💰 Tổng tiền: <b>${amount} ${order.currency}</b>\n` +
      `🕐 Thời gian: ${new Date().toLocaleString("vi-VN")}`;
    await sendTelegramMessage(config.botToken, config.chatId, msg);
  } catch { /* silent */ }
}

export async function notifyAdminPayment(userId: number, order: {
  id: number; orderCode: string; customerName: string; totalAmount: number; currency: string;
}): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "admin");
    if (!config?.enabled || !config.botToken || !config.chatId || !config.notifyPayment) return;
    const amount = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
    const msg = `✅ <b>THANH TOÁN THÀNH CÔNG</b>\n\n` +
      `📋 Mã đơn: <code>${order.orderCode}</code>\n` +
      `👤 Khách: ${order.customerName}\n` +
      `💰 Số tiền: <b>${amount} ${order.currency}</b>\n` +
      `🕐 Thời gian: ${new Date().toLocaleString("vi-VN")}`;
    await sendTelegramMessage(config.botToken, config.chatId, msg);
  } catch { /* silent */ }
}

export async function notifyAdminRefund(userId: number, refund: {
  id: number; customerName: string; customerEmail: string; amount: number; reason: string;
}): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "admin");
    if (!config?.enabled || !config.botToken || !config.chatId || !config.notifyRefund) return;
    const amount = new Intl.NumberFormat("vi-VN").format(refund.amount);
    const msg = `🔄 <b>YÊU CẦU HOÀN TIỀN</b>\n\n` +
      `👤 Khách: ${refund.customerName}\n` +
      `📧 Email: ${refund.customerEmail}\n` +
      `💰 Số tiền: <b>${amount} VND</b>\n` +
      `📝 Lý do: ${refund.reason}\n` +
      `🕐 Thời gian: ${new Date().toLocaleString("vi-VN")}`;
    await sendTelegramMessage(config.botToken, config.chatId, msg);
  } catch { /* silent */ }
}

export async function notifyAdminNewCustomer(userId: number, customer: {
  name: string; email: string;
}): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "admin");
    if (!config?.enabled || !config.botToken || !config.chatId || !config.notifyNewCustomer) return;
    const msg = `👋 <b>KHÁCH HÀNG MỚI</b>\n\n` +
      `👤 Tên: ${customer.name}\n` +
      `📧 Email: ${customer.email}\n` +
      `🕐 Thời gian: ${new Date().toLocaleString("vi-VN")}`;
    await sendTelegramMessage(config.botToken, config.chatId, msg);
  } catch { /* silent */ }
}

// ─── User Bot Notifications ───────────────────────────────────────────────────
const ORDER_STATUS_LABELS: Record<string, string> = {
  CREATED:   "⏳ Chờ thanh toán",
  PAID:      "✅ Đã thanh toán",
  SHIPPING:  "🚚 Đang giao hàng",
  COMPLETED: "🎉 Hoàn thành",
  FAILED:    "❌ Thất bại",
  REFUNDED:  "💸 Đã hoàn tiền",
  CANCELLED: "🚫 Đã hủy",
  WARRANTY:  "🛡️ Bảo hành",
};

export async function notifyUserOrderStatus(userId: number, customerId: number, order: {
  orderCode: string; status: string; productName?: string; totalAmount: number; currency: string;
}): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "user");
    if (!config?.enabled || !config.botToken || !config.notifyOrderStatus) return;
    // Find subscriber by customerId
    const subscribers = await db.getTelegramSubscribers(userId);
    const sub = subscribers.find((s: any) => s.customerId === customerId && s.isActive);
    if (!sub) return;
    const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
    const amount = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
    const msg = `📦 <b>CẬP NHẬT ĐƠN HÀNG</b>\n\n` +
      `📋 Mã đơn: <code>${order.orderCode}</code>\n` +
      (order.productName ? `📦 Sản phẩm: ${order.productName}\n` : "") +
      `💰 Tổng tiền: ${amount} ${order.currency}\n` +
      `📊 Trạng thái: <b>${statusLabel}</b>\n` +
      `🕐 Cập nhật: ${new Date().toLocaleString("vi-VN")}`;
    await sendTelegramMessage(config.botToken, sub.chatId, msg);
  } catch { /* silent */ }
}

// ─── Handle incoming webhook update from User Bot ─────────────────────────────
export async function handleUserBotUpdate(userId: number, update: any): Promise<void> {
  try {
    const config = await db.getTelegramBotConfig(userId, "user");
    if (!config?.enabled || !config.botToken) return;
    const message = update.message;
    if (!message) return;
    const chatId = String(message.chat.id);
    const text = (message.text || "").trim().toLowerCase();
    const username = message.from?.username;
    const firstName = message.from?.first_name || "Bạn";
    if (text === "/start") {
      // Ask for email to link account
      await sendTelegramMessage(config.botToken, chatId,
        `👋 Xin chào <b>${firstName}</b>!\n\n` +
        `Để nhận thông báo đơn hàng, vui lòng gửi email tài khoản của bạn.\n\n` +
        `Ví dụ: <code>email@example.com</code>`
      );
    } else if (text === "/stop" || text === "/unsubscribe") {
      // Unsubscribe
      const sub = await db.getTelegramSubscriberByChatId(userId, chatId);
      if (sub) {
        await db.upsertTelegramSubscriber(userId, sub.customerId, chatId, { isActive: false });
        await sendTelegramMessage(config.botToken, chatId,
          `✅ Đã hủy đăng ký nhận thông báo. Gửi /start để đăng ký lại.`
        );
      } else {
        await sendTelegramMessage(config.botToken, chatId, `Bạn chưa đăng ký nhận thông báo.`);
      }
    } else if (text.includes("@")) {
      // User sent email - try to link account
      const email = text.replace(/\s/g, "");
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return;
      const { customers } = await import("../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(customers)
        .where(and(eq(customers.userId, userId), eq(customers.email, email)));
      const customer = rows[0];
      if (!customer) {
        await sendTelegramMessage(config.botToken, chatId,
          `❌ Không tìm thấy tài khoản với email <code>${email}</code>.\n\nVui lòng kiểm tra lại email.`
        );
        return;
      }
      await db.upsertTelegramSubscriber(userId, customer.id, chatId, { username, firstName, isActive: true });
      await sendTelegramMessage(config.botToken, chatId,
        `✅ Đã liên kết thành công!\n\n` +
        `👤 Tài khoản: <b>${customer.name}</b>\n` +
        `📧 Email: ${customer.email}\n\n` +
        `Bạn sẽ nhận thông báo khi đơn hàng có cập nhật.\n` +
        `Gửi /stop để hủy đăng ký.`
      );
    } else {
      await sendTelegramMessage(config.botToken, chatId,
        `Xin chào! Gửi email của bạn để liên kết tài khoản và nhận thông báo đơn hàng.\n\nGửi /stop để hủy đăng ký.`
      );
    }
  } catch (e) {
    console.error("[UserBot] handleUpdate error:", e);
  }
}
