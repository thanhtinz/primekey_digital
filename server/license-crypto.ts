/**
 * License Crypto Module
 * =====================
 * Hệ thống mã hóa license key bảo mật cao sử dụng HMAC-SHA256.
 *
 * KIẾN TRÚC BẢO MẬT:
 * ─────────────────────────────────────────────────────────────────
 * 1. LICENSE_MASTER_KEY: Secret key chỉ developer biết (env var)
 * 2. License key = HMAC-SHA256(payload, MASTER_KEY) → encode Base32
 * 3. Payload = email:domain:plan:expiryTimestamp (không thể giả mạo)
 * 4. Khi verify: decode key → tính lại HMAC → so sánh constant-time
 * 5. Thêm domain check: domain trong key phải khớp domain hiện tại
 * 6. Thêm email check: email trong key phải khớp email đăng ký
 *
 * CÁCH TẠO LICENSE KEY (dành cho developer):
 * ─────────────────────────────────────────────────────────────────
 * npx ts-node scripts/generate-license.ts \
 *   --email user@example.com \
 *   --domain example.com \
 *   --plan pro \
 *   --days 365
 *
 * OUTPUT: ABCD-EFGH-IJKL-MNOP-QRST (25 ký tự, 5 nhóm)
 */

import crypto from "crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const KEY_VERSION = "v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LicensePayload {
  email: string;       // Email đăng ký (lowercase)
  domain: string;      // Domain được cấp phép (lowercase, không có www)
  plan: string;        // Gói: standard | pro | enterprise
  expiresAt: number;   // Unix timestamp (ms), 0 = vĩnh viễn
  issuedAt: number;    // Unix timestamp (ms) khi cấp
  owner?: string;      // Tên chủ sở hữu (optional)
}

export interface LicenseValidationResult {
  valid: boolean;
  reason?: string;
  payload?: LicensePayload;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lấy master key từ env, fallback về key mặc định cho development */
function getMasterKey(): string {
  const key = process.env.LICENSE_MASTER_KEY;
  if (!key) {
    // Chỉ dùng trong development - production PHẢI set LICENSE_MASTER_KEY
    if (process.env.NODE_ENV === "production") {
      throw new Error("LICENSE_MASTER_KEY is required in production");
    }
    console.warn("[License] WARNING: Using default master key. Set LICENSE_MASTER_KEY in production!");
    return "invoice-prime-default-dev-key-2024-do-not-use-in-production";
  }
  return key;
}

/** Normalize domain: bỏ protocol, www, trailing slash, lowercase */
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "") // bỏ port
    .trim();
}

/** Normalize email: lowercase, trim */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Encode bytes thành Base32 */
function toBase32(buffer: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of Array.from(buffer)) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return result;
}

/** Decode Base32 về bytes */
function fromBase32(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleanStr) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Format key thành nhóm 5 ký tự: ABCDE-FGHIJ-KLMNO-PQRST-UVWXY */
function formatKey(raw: string): string {
  const clean = raw.replace(/[^A-Z2-7]/g, "").slice(0, 25);
  const padded = clean.padEnd(25, "A");
  return [
    padded.slice(0, 5),
    padded.slice(5, 10),
    padded.slice(10, 15),
    padded.slice(15, 20),
    padded.slice(20, 25),
  ].join("-");
}

/** Tạo HMAC-SHA256 signature cho payload */
function signPayload(payloadStr: string, masterKey: string): string {
  return crypto
    .createHmac("sha256", masterKey)
    .update(payloadStr)
    .digest("hex");
}

/** So sánh 2 chuỗi constant-time (chống timing attack) */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Vẫn thực hiện so sánh để tránh timing leak
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Tạo license key từ payload
 * Cấu trúc: KEY_VERSION:email:domain:plan:expiresAt:issuedAt[:owner]
 * License key = Base32(HMAC-SHA256(payload, MASTER_KEY))[:25]
 */
export function generateLicenseKey(payload: LicensePayload): {
  licenseKey: string;
  signature: string;
  payloadStr: string;
} {
  const masterKey = getMasterKey();
  const email = normalizeEmail(payload.email);
  const domain = normalizeDomain(payload.domain);
  const issuedAt = payload.issuedAt || Date.now();

  const payloadStr = [
    KEY_VERSION,
    email,
    domain,
    payload.plan,
    payload.expiresAt.toString(),
    issuedAt.toString(),
    payload.owner || "",
  ].join(":");

  const signature = signPayload(payloadStr, masterKey);
  const keyRaw = toBase32(Buffer.from(signature.slice(0, 16), "hex")); // 16 bytes → 26 Base32 chars
  const licenseKey = formatKey(keyRaw);

  return { licenseKey, signature, payloadStr };
}

/**
 * Tạo license activation token (JWT-like, lưu trong DB)
 * Token này lưu toàn bộ payload đã được ký, dùng để verify offline
 */
export function createActivationToken(payload: LicensePayload, licenseKey: string): string {
  const masterKey = getMasterKey();
  const email = normalizeEmail(payload.email);
  const domain = normalizeDomain(payload.domain);

  const tokenPayload = {
    v: KEY_VERSION,
    e: email,
    d: domain,
    p: payload.plan,
    exp: payload.expiresAt,
    iat: payload.issuedAt || Date.now(),
    o: payload.owner || "",
    k: licenseKey.replace(/-/g, ""), // key không có dấu gạch
  };

  const payloadStr = JSON.stringify(tokenPayload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const sig = signPayload(payloadB64, masterKey);
  const sigB64 = Buffer.from(sig).toString("base64url");

  return `${payloadB64}.${sigB64}`;
}

/**
 * Xác thực license key với 3 lớp bảo mật:
 * 1. Kiểm tra chữ ký HMAC của activation token
 * 2. Kiểm tra email khớp
 * 3. Kiểm tra domain khớp
 * 4. Kiểm tra hạn sử dụng
 */
export function validateLicense(
  activationToken: string,
  inputEmail: string,
  inputDomain: string,
): LicenseValidationResult {
  try {
    const masterKey = getMasterKey();
    const parts = activationToken.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "Token không hợp lệ" };
    }

    const [payloadB64, sigB64] = parts;

    // Lớp 1: Xác thực chữ ký HMAC
    const expectedSig = signPayload(payloadB64, masterKey);
    const expectedSigB64 = Buffer.from(expectedSig).toString("base64url");
    if (!timingSafeEqual(sigB64, expectedSigB64)) {
      return { valid: false, reason: "Chữ ký không hợp lệ - license key có thể bị giả mạo" };
    }

    // Parse payload
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const tokenPayload = JSON.parse(payloadStr);

    // Lớp 2: Xác thực email
    const normalizedInputEmail = normalizeEmail(inputEmail);
    if (!timingSafeEqual(tokenPayload.e, normalizedInputEmail)) {
      return { valid: false, reason: "Email không khớp với license key này" };
    }

    // Lớp 3: Xác thực domain
    const normalizedInputDomain = normalizeDomain(inputDomain);
    const licensedDomain = normalizeDomain(tokenPayload.d);

    // Cho phép localhost và IP trong development
    const isDevDomain = normalizedInputDomain === "localhost" ||
      normalizedInputDomain.startsWith("127.") ||
      normalizedInputDomain.startsWith("192.168.") ||
      normalizedInputDomain === "0.0.0.0";

    if (!isDevDomain && !timingSafeEqual(licensedDomain, normalizedInputDomain)) {
      return {
        valid: false,
        reason: `Domain không được cấp phép. License này chỉ dùng cho: ${licensedDomain}`,
      };
    }

    // Lớp 4: Kiểm tra hạn sử dụng
    if (tokenPayload.exp > 0 && Date.now() > tokenPayload.exp) {
      const expDate = new Date(tokenPayload.exp).toLocaleDateString("vi-VN");
      return { valid: false, reason: `License đã hết hạn vào ngày ${expDate}` };
    }

    return {
      valid: true,
      payload: {
        email: tokenPayload.e,
        domain: tokenPayload.d,
        plan: tokenPayload.p,
        expiresAt: tokenPayload.exp,
        issuedAt: tokenPayload.iat,
        owner: tokenPayload.o || undefined,
      },
    };
  } catch (err) {
    console.error("[License] Validation error:", err);
    return { valid: false, reason: "Lỗi xác thực license" };
  }
}

/**
 * Xác thực license key format (không cần master key)
 * Chỉ kiểm tra format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 */
export function isValidKeyFormat(key: string): boolean {
  const clean = key.replace(/-/g, "").toUpperCase();
  return /^[A-Z2-7]{25}$/.test(clean);
}

/**
 * Tạo activation token từ license key đã được verify với License Server
 * Dùng khi có License Server bên ngoài trả về payload
 */
export function createOfflineToken(
  email: string,
  domain: string,
  plan: string,
  expiresAt: number,
  licenseKey: string,
  owner?: string,
): string {
  const payload: LicensePayload = {
    email: normalizeEmail(email),
    domain: normalizeDomain(domain),
    plan,
    expiresAt,
    issuedAt: Date.now(),
    owner,
  };
  return createActivationToken(payload, licenseKey);
}
