/**
 * License Key System
 * Kiểm tra license key khi server khởi động và trong middleware
 * 
 * Cách hoạt động:
 * 1. Admin cấp LICENSE_KEY qua env variable
 * 2. Server gọi LICENSE_SERVER_URL để xác thực key + domain
 * 3. Nếu license hợp lệ, server hoạt động bình thường
 * 4. Nếu license không hợp lệ/hết hạn, server trả về lỗi 402
 * 
 * Để bán code: bạn cần xây dựng LICENSE_SERVER_URL riêng
 * Server đó sẽ quản lý bảng licenses và xác thực key
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
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Xác thực license key với server của bạn
 * Nếu không có LICENSE_SERVER_URL, chạy ở chế độ development (không check)
 */
export async function verifyLicense(licenseKey: string, domain: string): Promise<LicenseInfo> {
  const licenseServerUrl = process.env.LICENSE_SERVER_URL;
  
  // Nếu không có server URL → development mode, luôn valid
  if (!licenseServerUrl) {
    console.log("[License] No LICENSE_SERVER_URL set - running in development mode");
    return { valid: true, plan: "development", features: ["all"] };
  }

  try {
    const response = await fetch(`${licenseServerUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    // Nếu không kết nối được server license → dùng cache hoặc cho phép tạm thời
    console.warn("[License] Cannot reach license server:", err.message);
    if (cachedLicense?.valid) {
      console.log("[License] Using cached license info");
      return cachedLicense;
    }
    // Grace period: cho phép chạy nếu không kết nối được (tránh downtime)
    return { valid: true, plan: "offline-grace", message: "License server unreachable - running in grace mode" };
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
  
  const info = await verifyLicense(licenseKey, domain);
  cachedLicense = info;
  lastCheckTime = Date.now();

  if (!info.valid) {
    console.error(`[License] ❌ Invalid license: ${info.message}`);
    // Không crash server - chỉ log warning, middleware sẽ block requests
  } else {
    const expiry = info.expiresAt ? ` (expires: ${info.expiresAt})` : "";
    console.log(`[License] ✅ License valid - Plan: ${info.plan}${expiry}`);
  }
}

/**
 * Express middleware kiểm tra license cho API requests
 * Chỉ block nếu LICENSE_KEY được set VÀ license không hợp lệ
 */
export function licenseMiddleware(req: Request, res: Response, next: NextFunction): void {
  const licenseKey = process.env.LICENSE_KEY;
  
  // Không có key → không check
  if (!licenseKey) {
    next();
    return;
  }

  // Refresh cache mỗi giờ
  if (Date.now() - lastCheckTime > CACHE_DURATION) {
    const domain = process.env.APP_DOMAIN || req.hostname || "localhost";
    verifyLicense(licenseKey, domain).then(info => {
      cachedLicense = info;
      lastCheckTime = Date.now();
    }).catch(() => {});
  }

  // Nếu chưa có cache → cho qua (sẽ check ở lần sau)
  if (!cachedLicense) {
    next();
    return;
  }

  // Nếu license không hợp lệ → block API
  if (!cachedLicense.valid) {
    res.status(402).json({
      error: "LICENSE_INVALID",
      message: cachedLicense.message || "License key không hợp lệ hoặc đã hết hạn",
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
