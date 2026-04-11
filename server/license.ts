/**
 * License Key System - Enhanced Security
 * ========================================
 * Kiểm tra license key khi server khởi động và trong middleware
 *
 * Cách hoạt động:
 * 1. Admin cấp LICENSE_KEY + LICENSE_MASTER_KEY qua env variable
 * 2. Server xác thực activation token từ DB (offline HMAC)
 * 3. Nếu có LICENSE_SERVER_URL, xác thực online định kỳ
 * 4. Nếu license không hợp lệ/hết hạn, server trả về lỗi 402
 *
 * BẢO MẬT:
 * - Không có grace mode (không cho phép chạy khi không verify được)
 * - Rate limiting cho activation attempts
 * - Không lộ thông tin chi tiết về lý do từ chối
 * - Cache có TTL ngắn hơn (30 phút thay vì 1 giờ)
 * - Periodic re-validation để phát hiện license bị thu hồi
 */
import type { Request, Response, NextFunction } from "express";

interface LicenseInfo {
  valid: boolean;
  plan?: string;
  expiresAt?: string;
  domain?: string;
  features?: string[];
  message?: string;
}

let cachedLicense: LicenseInfo | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 phút (giảm từ 1 giờ)

// Rate limiting cho activation attempts
const activationAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ACTIVATION_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 phút

/**
 * Kiểm tra rate limit cho IP
 */
export function checkActivationRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = activationAttempts.get(ip);

  if (!record || now > record.resetAt) {
    activationAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_ACTIVATION_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Xác thực license key với server của bạn
 * Nếu không có LICENSE_SERVER_URL, chỉ dùng offline validation (từ DB)
 */
export async function verifyLicense(licenseKey: string, domain: string): Promise<LicenseInfo> {
  const licenseServerUrl = process.env.LICENSE_SERVER_URL;

  // Nếu không có server URL → chỉ dùng offline validation (không có grace mode)
  if (!licenseServerUrl) {
    return { valid: false, message: "Cần cấu hình LICENSE_SERVER_URL hoặc kích hoạt offline" };
  }

  try {
    const response = await fetch(`${licenseServerUrl}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
      },
      body: JSON.stringify({ key: licenseKey, domain }),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { valid: false, message: (data as any).message || "License không hợp lệ" };
    }

    const data = await response.json() as LicenseInfo;
    return data;
  } catch (err: any) {
    // KHÔNG có grace mode - nếu không kết nối được server thì dùng cache
    console.warn("[License] Cannot reach license server:", err.message);
    if (cachedLicense?.valid) {
      console.log("[License] Using cached license info (server unreachable)");
      return cachedLicense;
    }
    // Không có cache → BLOCK (không có grace mode)
    return { valid: false, message: "Không thể xác thực license. Vui lòng kiểm tra kết nối." };
  }
}

/**
 * Kiểm tra license từ DB activation token (offline mode)
 * Đây là phương thức chính khi không có LICENSE_SERVER_URL
 */
export async function verifyLicenseFromDb(): Promise<LicenseInfo> {
  try {
    const { getDb } = await import("./db");
    const { userSettings } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return { valid: false, message: "Database không khả dụng" };

    const rows = await db.select({
      licenseActivated: userSettings.licenseActivated,
      licenseSignature: userSettings.licenseSignature,
      licenseEmail: userSettings.licenseEmail,
      licensePlan: userSettings.licensePlan,
      licenseExpiresAt: userSettings.licenseExpiresAt,
      licenseDomain: userSettings.licenseDomain,
    }).from(userSettings).limit(1);

    const s = rows[0];
    if (!s || !s.licenseActivated || !s.licenseSignature || !s.licenseEmail) {
      return { valid: false, message: "Chưa kích hoạt license" };
    }

    // Kiểm tra hết hạn
    if (s.licenseExpiresAt && s.licenseExpiresAt < new Date()) {
      return { valid: false, message: `License đã hết hạn vào ${s.licenseExpiresAt.toLocaleDateString("vi-VN")}` };
    }

    // Re-validate activation token với HMAC để đảm bảo không bị tamper
    const { validateLicense } = await import("./license-crypto");
    const domain = s.licenseDomain || process.env.APP_DOMAIN || "localhost";
    const result = validateLicense(s.licenseSignature, s.licenseEmail, domain);

    if (!result.valid) {
      console.error("[License] DB token validation failed:", result.reason);
      return { valid: false, message: "License key không hợp lệ - vui lòng kích hoạt lại" };
    }

    return {
      valid: true,
      plan: s.licensePlan || "standard",
      expiresAt: s.licenseExpiresAt ? s.licenseExpiresAt.toISOString() : undefined,
      domain: s.licenseDomain || undefined,
    };
  } catch (err: any) {
    // Nếu getMasterKey() throw (không có env var), trả về lỗi rõ ràng
    if (err.message?.includes("LICENSE_MASTER_KEY")) {
      console.error("[License] FATAL:", err.message);
      return { valid: false, message: "Lỗi cấu hình server - liên hệ quản trị viên" };
    }
    console.error("[License] DB verification error:", err.message);
    return { valid: false, message: "Lỗi xác thực license" };
  }
}

/**
 * Kiểm tra license khi server khởi động
 */
export async function checkLicenseOnStartup(): Promise<void> {
  const licenseKey = process.env.LICENSE_KEY;

  if (!licenseKey) {
    console.log("[License] No LICENSE_KEY set - running without license check");
    return;
  }

  const domain = process.env.APP_DOMAIN || "localhost";
  console.log(`[License] Checking license for domain: ${domain}`);

  const licenseServerUrl = process.env.LICENSE_SERVER_URL;
  let info: LicenseInfo;

  if (licenseServerUrl) {
    info = await verifyLicense(licenseKey, domain);
  } else {
    info = await verifyLicenseFromDb();
  }

  cachedLicense = info;
  lastCheckTime = Date.now();

  if (!info.valid) {
    console.error(`[License] ❌ Invalid license: ${info.message}`);
  } else {
    const expiry = info.expiresAt ? ` (expires: ${info.expiresAt})` : "";
    console.log(`[License] ✅ License valid - Plan: ${info.plan}${expiry}`);
  }
}

/**
 * Express middleware kiểm tra license cho API requests
 * Chỉ block nếu LICENSE_KEY được set VÀ license không hợp lệ
 */
export async function licenseMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const licenseKey = process.env.LICENSE_KEY;

  // Không có key → không check
  if (!licenseKey) {
    next();
    return;
  }

  // Refresh cache mỗi 30 phút
  if (Date.now() - lastCheckTime > CACHE_DURATION) {
    const domain = process.env.APP_DOMAIN || req.hostname || "localhost";
    const licenseServerUrl = process.env.LICENSE_SERVER_URL;

    try {
      let freshInfo: LicenseInfo;
      if (licenseServerUrl) {
        freshInfo = await verifyLicense(licenseKey, domain);
      } else {
        freshInfo = await verifyLicenseFromDb();
      }
      cachedLicense = freshInfo;
      lastCheckTime = Date.now();
    } catch {
      console.warn("[License] Failed to refresh license cache");
    }
  }

  // Nếu chưa có cache → thử verify ngay
  if (!cachedLicense) {
    const domain = process.env.APP_DOMAIN || req.hostname || "localhost";
    const licenseServerUrl = process.env.LICENSE_SERVER_URL;
    try {
      if (licenseServerUrl) {
        cachedLicense = await verifyLicense(licenseKey, domain);
      } else {
        cachedLicense = await verifyLicenseFromDb();
      }
      lastCheckTime = Date.now();
    } catch {
      next();
      return;
    }
  }

  // Nếu license không hợp lệ → block API
  if (!cachedLicense.valid) {
    res.status(402).json({
      error: "LICENSE_INVALID",
      message: "License key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ nhà cung cấp.",
      licenseRequired: true,
    });
    return;
  }

  next();
}

/**
 * Lấy thông tin license hiện tại (cho admin dashboard)
 */
export function getCurrentLicense(): LicenseInfo | null {
  return cachedLicense;
}

/**
 * Kiểm tra xem feature có được phép trong plan hiện tại không
 */
export function isFeatureAllowed(feature: string): boolean {
  if (!process.env.LICENSE_KEY) return true; // No license check
  if (!cachedLicense?.valid) return false;
  if (!cachedLicense.features) return true; // No feature restrictions
  return cachedLicense.features.includes("all") || cachedLicense.features.includes(feature);
}

/**
 * Invalidate cache (dùng sau khi deactivate)
 */
export function invalidateLicenseCache(): void {
  cachedLicense = null;
  lastCheckTime = 0;
}
