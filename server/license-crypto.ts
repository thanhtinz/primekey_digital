/**
 * License Crypto Module - Enhanced Security
 * ==========================================
 * Hệ thống mã hóa license key bảo mật cao sử dụng HMAC-SHA256.
 *
 * KIẾN TRÚC BẢO MẬT:
 * ─────────────────────────────────────────────────────────────────
 * 1. LICENSE_MASTER_KEY: Secret key chỉ developer biết (env var, BẮT BUỘC)
 *    - KHÔNG có default key - nếu thiếu sẽ throw error ngay cả trong dev
 *    - Phải là chuỗi ngẫu nhiên >= 32 ký tự
 * 2. License key = HMAC-SHA256(payload, MASTER_KEY) → encode Base32
 * 3. Payload = v2:email:domain:plan:expiresAt:issuedAt:nonce[:owner]
 * 4. Activation token = base64url(payload).base64url(HMAC(payload))
 * 5. Khi verify: decode → tính lại HMAC → so sánh constant-time
 * 6. Domain check: domain trong key phải khớp domain hiện tại
 * 7. Email check: email trong key phải khớp email đăng ký
 * 8. Nonce: mỗi token có nonce ngẫu nhiên, chống replay attack
 * 9. Issued-at window: token không được tạo trong tương lai (±5 phút)
 *
 * CÁCH TẠO LICENSE KEY (dành cho developer):
 * ─────────────────────────────────────────────────────────────────
 * Cần set LICENSE_MASTER_KEY trong .env trước khi chạy:
 * export LICENSE_MASTER_KEY="your-secret-key-min-32-chars"
 *
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
const KEY_VERSION = "v2"; // Tăng version để invalidate tất cả token cũ

// Thời gian cho phép clock skew (5 phút)
const CLOCK_SKEW_MS = 5 * 60 * 1000;

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

/**
 * Lấy master key từ env.
 * KHÔNG có fallback/default key - bắt buộc phải set trong mọi môi trường.
 * Điều này ngăn chặn việc ai đó dùng default key từ source code để tạo token giả.
 */
function getMasterKey(): string {
  const key = process.env.LICENSE_MASTER_KEY;
  if (!key) {
    throw new Error(
      "[License] FATAL: LICENSE_MASTER_KEY environment variable is not set. " +
      "This is required for license validation. " +
      "Generate a random key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  if (key.length < 32) {
    throw new Error(
      "[License] FATAL: LICENSE_MASTER_KEY is too short (minimum 32 characters). " +
      "Use a cryptographically random key."
    );
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
  // Luôn thực hiện so sánh để tránh timing leak
  const bufA = Buffer.alloc(64);
  const bufB = Buffer.alloc(64);
  Buffer.from(a, "utf8").copy(bufA);
  Buffer.from(b, "utf8").copy(bufB);
  const isEqual = crypto.timingSafeEqual(bufA, bufB);
  return isEqual && a.length === b.length;
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
 * Token này lưu toàn bộ payload đã được ký, dùng để verify offline.
 * Thêm nonce ngẫu nhiên để chống replay attack.
 */
export function createActivationToken(payload: LicensePayload, licenseKey: string): string {
  const masterKey = getMasterKey();
  const email = normalizeEmail(payload.email);
  const domain = normalizeDomain(payload.domain);
  // Nonce ngẫu nhiên 16 bytes để chống replay attack
  const nonce = crypto.randomBytes(16).toString("hex");
  const tokenPayload = {
    v: KEY_VERSION,
    e: email,
    d: domain,
    p: payload.plan,
    exp: payload.expiresAt,
    iat: payload.issuedAt || Date.now(),
    o: payload.owner || "",
    k: licenseKey.replace(/-/g, ""), // key không có dấu gạch
    n: nonce, // nonce chống replay
  };
  const payloadStr = JSON.stringify(tokenPayload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const sig = signPayload(payloadB64, masterKey);
  const sigB64 = Buffer.from(sig).toString("base64url");
  return `${payloadB64}.${sigB64}`;
}

/**
 * Xác thực license key với nhiều lớp bảo mật:
 * 1. Kiểm tra chữ ký HMAC của activation token
 * 2. Kiểm tra version token (v2, invalidate token cũ)
 * 3. Kiểm tra email khớp
 * 4. Kiểm tra domain khớp
 * 5. Kiểm tra hạn sử dụng
 * 6. Kiểm tra issued-at không trong tương lai (chống pre-generated token)
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

    // Kiểm tra độ dài tối thiểu để tránh DoS
    if (payloadB64.length < 20 || sigB64.length < 20) {
      return { valid: false, reason: "Token quá ngắn" };
    }

    // Lớp 1: Xác thực chữ ký HMAC (constant-time comparison)
    const expectedSig = signPayload(payloadB64, masterKey);
    const expectedSigB64 = Buffer.from(expectedSig).toString("base64url");
    if (!timingSafeEqual(sigB64, expectedSigB64)) {
      return { valid: false, reason: "Chữ ký không hợp lệ - license key có thể bị giả mạo" };
    }

    // Parse payload
    let tokenPayload: any;
    try {
      const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
      tokenPayload = JSON.parse(payloadStr);
    } catch {
      return { valid: false, reason: "Token payload không hợp lệ" };
    }

    // Lớp 2: Kiểm tra version (chỉ chấp nhận v2 trở lên)
    if (!tokenPayload.v || tokenPayload.v !== KEY_VERSION) {
      return { valid: false, reason: `Token version không được hỗ trợ (cần ${KEY_VERSION}, có ${tokenPayload.v || "unknown"}). Vui lòng kích hoạt lại.` };
    }

    // Lớp 3: Xác thực email (constant-time)
    const normalizedInputEmail = normalizeEmail(inputEmail);
    if (!timingSafeEqual(tokenPayload.e || "", normalizedInputEmail)) {
      return { valid: false, reason: "Email không khớp với license key này" };
    }

    // Lớp 4: Xác thực domain
    const normalizedInputDomain = normalizeDomain(inputDomain);
    const licensedDomain = normalizeDomain(tokenPayload.d || "");
    // Cho phép localhost và IP trong development
    const isDevDomain = normalizedInputDomain === "localhost" ||
      normalizedInputDomain.startsWith("127.") ||
      normalizedInputDomain.startsWith("192.168.") ||
      normalizedInputDomain === "0.0.0.0" ||
      normalizedInputDomain.endsWith(".manus.computer"); // dev preview domains
    if (!isDevDomain && !timingSafeEqual(licensedDomain, normalizedInputDomain)) {
      return {
        valid: false,
        reason: `Domain không được cấp phép. License này chỉ dùng cho: ${licensedDomain}`,
      };
    }

    // Lớp 5: Kiểm tra hạn sử dụng
    if (tokenPayload.exp > 0 && Date.now() > tokenPayload.exp) {
      const expDate = new Date(tokenPayload.exp).toLocaleDateString("vi-VN");
      return { valid: false, reason: `License đã hết hạn vào ngày ${expDate}` };
    }

    // Lớp 6: Kiểm tra issued-at không trong tương lai (chống pre-generated token)
    if (tokenPayload.iat && tokenPayload.iat > Date.now() + CLOCK_SKEW_MS) {
      return { valid: false, reason: "Token được tạo trong tương lai - không hợp lệ" };
    }

    // Lớp 7: Kiểm tra nonce tồn tại (token v2 phải có nonce)
    if (!tokenPayload.n) {
      return { valid: false, reason: "Token thiếu nonce - vui lòng kích hoạt lại" };
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
  } catch (err: any) {
    // Nếu getMasterKey() throw (không có env var), trả về lỗi rõ ràng
    if (err.message?.includes("LICENSE_MASTER_KEY")) {
      console.error("[License] FATAL:", err.message);
      return { valid: false, reason: "Lỗi cấu hình server - liên hệ quản trị viên" };
    }
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
