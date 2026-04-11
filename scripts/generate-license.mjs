/**
 * License Key Generator - Công cụ tạo license key cho developer
 * =============================================================
 * Sử dụng: node scripts/generate-license.mjs [options]
 *
 * Options:
 *   --email    Email đăng ký (bắt buộc)
 *   --domain   Domain được cấp phép (bắt buộc)
 *   --days     Số ngày hiệu lực (0 = vĩnh viễn, mặc định: 365)
 *   --owner    Tên chủ sở hữu (tùy chọn)
 *   --key      LICENSE_MASTER_KEY (hoặc set env var)
 *
 * Ví dụ:
 *   LICENSE_MASTER_KEY=my-secret node scripts/generate-license.mjs \
 *     --email user@example.com --domain example.com --days 365
 */

import crypto from "crypto";

// ─── Base32 ───────────────────────────────────────────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(buffer) {
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
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 31];
  return result;
}

function formatKey(raw) {
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

function normalizeDomain(domain) {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
}

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// ─── Parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const email = getArg("email");
const domain = getArg("domain");
const days = parseInt(getArg("days") || "365", 10);
const owner = getArg("owner") || "";
const masterKey = getArg("key") || process.env.LICENSE_MASTER_KEY;

if (!email || !domain) {
  console.error("❌ Thiếu tham số bắt buộc: --email và --domain");
  console.error("\nCách dùng:");
  console.error("  node scripts/generate-license.mjs --email user@example.com --domain example.com --days 365");
  process.exit(1);
}

if (!masterKey) {
  console.error("❌ Thiếu LICENSE_MASTER_KEY. Truyền qua --key hoặc env var.");
  process.exit(1);
}

// ─── Generate ─────────────────────────────────────────────────────────────────
const KEY_VERSION = "v1";
const normalizedEmail = normalizeEmail(email);
const normalizedDomain = normalizeDomain(domain);
const issuedAt = Date.now();
const expiresAt = days === 0 ? 0 : issuedAt + days * 24 * 60 * 60 * 1000;

const payloadStr = [
  KEY_VERSION,
  normalizedEmail,
  normalizedDomain,
  "license",
  expiresAt.toString(),
  issuedAt.toString(),
  owner,
].join(":");

const signature = crypto
  .createHmac("sha256", masterKey)
  .update(payloadStr)
  .digest("hex");

const keyRaw = toBase32(Buffer.from(signature.slice(0, 16), "hex"));
const licenseKey = formatKey(keyRaw);

// ─── Tạo activation token ─────────────────────────────────────────────────────
const tokenPayload = {
  v: KEY_VERSION,
  e: normalizedEmail,
  d: normalizedDomain,
  p: "license",
  exp: expiresAt,
  iat: issuedAt,
  o: owner,
  k: licenseKey.replace(/-/g, ""),
};

const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
const tokenSig = crypto
  .createHmac("sha256", masterKey)
  .update(payloadB64)
  .digest();
const sigB64 = Buffer.from(tokenSig.toString("hex")).toString("base64url");
const activationToken = `${payloadB64}.${sigB64}`;

// ─── Output ───────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("  INVOICE PRIME - LICENSE KEY GENERATOR");
console.log("=".repeat(60));
console.log(`\n📧 Email:          ${normalizedEmail}`);
console.log(`🌐 Domain:         ${normalizedDomain}`);
console.log(`📋 Loại:           Giấy phép`);
console.log(`👤 Chủ sở hữu:    ${owner || "(không có)"}`);
console.log(`📅 Ngày cấp:       ${new Date(issuedAt).toLocaleString("vi-VN")}`);
console.log(`⏰ Hết hạn:        ${expiresAt === 0 ? "Vĩnh viễn" : new Date(expiresAt).toLocaleString("vi-VN")}`);
console.log("\n" + "-".repeat(60));
console.log(`\n🔑 LICENSE KEY:\n\n   ${licenseKey}\n`);
console.log("-".repeat(60));
console.log(`\n🔐 ACTIVATION TOKEN (cấp cho user):\n`);
console.log(`   ${activationToken}\n`);
console.log("=".repeat(60));
console.log("\n⚠️  Lưu ý bảo mật:");
console.log("   - Không chia sẻ LICENSE_MASTER_KEY");
console.log("   - Activation token chứa toàn bộ thông tin đã ký");
console.log("   - License key (ngắn) dùng để user nhập, token dùng để verify");
console.log("=".repeat(60) + "\n");
