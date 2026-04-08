import { describe, it, expect } from "vitest";
import { generateSignature } from "./payos";
import crypto from "crypto";

describe("PayOS Signature Generation", () => {
  const checksumKey = "test_checksum_key_12345";

  it("generates signature in correct alphabetical format", () => {
    const data = {
      orderCode: 123456,
      amount: 10000,
      description: "THANH TOAN DON HANG",
      cancelUrl: "https://example.com/cancel",
      returnUrl: "https://example.com/return",
    };

    const signature = generateSignature(data, checksumKey);

    // Manually compute expected signature
    const expectedDataString = `amount=10000&cancelUrl=https://example.com/cancel&description=THANH TOAN DON HANG&orderCode=123456&returnUrl=https://example.com/return`;
    const expectedSignature = crypto
      .createHmac("sha256", checksumKey)
      .update(expectedDataString)
      .digest("hex");

    expect(signature).toBe(expectedSignature);
  });

  it("rounds amount to integer before signing", () => {
    const data = {
      orderCode: 999,
      amount: 10000.75,
      description: "TEST",
      cancelUrl: "https://example.com/cancel",
      returnUrl: "https://example.com/return",
    };

    const signature = generateSignature(data, checksumKey);

    // Amount should be rounded to 10001
    const expectedDataString = `amount=10001&cancelUrl=https://example.com/cancel&description=TEST&orderCode=999&returnUrl=https://example.com/return`;
    const expectedSignature = crypto
      .createHmac("sha256", checksumKey)
      .update(expectedDataString)
      .digest("hex");

    expect(signature).toBe(expectedSignature);
  });

  it("signature is a 64-char hex string", () => {
    const data = {
      orderCode: 1,
      amount: 1000,
      description: "TEST",
      cancelUrl: "https://example.com/cancel",
      returnUrl: "https://example.com/return",
    };

    const signature = generateSignature(data, checksumKey);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });
});
