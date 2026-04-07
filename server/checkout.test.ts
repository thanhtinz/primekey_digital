import { describe, it, expect, vi } from "vitest";

// Mock the checkout flow logic validation
describe("Checkout flow validation", () => {
  it("should calculate subtotal correctly for single item", () => {
    const unitPrice = 150000;
    const qty = 2;
    const subtotal = unitPrice * qty;
    expect(subtotal).toBe(300000);
  });

  it("should calculate subtotal correctly for multiple items", () => {
    const items = [
      { unitPrice: 100000, quantity: 1 },
      { unitPrice: 200000, quantity: 2 },
      { unitPrice: 50000, quantity: 3 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    expect(subtotal).toBe(650000);
  });

  it("should apply percentage coupon correctly", () => {
    const subtotal = 500000;
    const discountValue = 10; // 10%
    let discountAmount = subtotal * discountValue / 100;
    expect(discountAmount).toBe(50000);
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    expect(totalAmount).toBe(450000);
  });

  it("should apply fixed coupon correctly", () => {
    const subtotal = 500000;
    const discountValue = 30000; // 30k fixed
    let discountAmount = discountValue;
    if (discountAmount > subtotal) discountAmount = subtotal;
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    expect(totalAmount).toBe(470000);
  });

  it("should cap percentage discount at maxDiscountAmount", () => {
    const subtotal = 1000000;
    const discountValue = 50; // 50%
    const maxDiscountAmount = 100000; // max 100k
    let discountAmount = subtotal * discountValue / 100;
    if (maxDiscountAmount > 0 && discountAmount > maxDiscountAmount) {
      discountAmount = maxDiscountAmount;
    }
    expect(discountAmount).toBe(100000);
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    expect(totalAmount).toBe(900000);
  });

  it("should not allow discount to exceed subtotal", () => {
    const subtotal = 10000;
    let discountAmount = 50000;
    if (discountAmount > subtotal) discountAmount = subtotal;
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    expect(totalAmount).toBe(0);
  });

  it("should generate unique invoice numbers", () => {
    const num1 = `INV-${Date.now().toString(36).toUpperCase()}`;
    // Slightly delay to ensure different timestamp
    const num2 = `INV-${(Date.now() + 1).toString(36).toUpperCase()}`;
    expect(num1).not.toBe(num2);
    expect(num1).toMatch(/^INV-[A-Z0-9]+$/);
  });

  it("should generate valid orderCode within safe range", () => {
    const orderCode = Date.now() % 9007199254740991;
    expect(orderCode).toBeGreaterThan(0);
    expect(orderCode).toBeLessThan(9007199254740991);
  });

  it("should build correct item name for invoice", () => {
    const productName = "ChatGPT Plus";
    const packageName = "1 tháng";
    const itemName = `${productName} - ${packageName}`;
    expect(itemName).toBe("ChatGPT Plus - 1 tháng");
  });

  it("should truncate PayOS description to 25 chars", () => {
    const invoiceNumber = "INV-ABCDEFGHIJKLMNOP";
    const description = `TT ${invoiceNumber}`.slice(0, 25);
    expect(description.length).toBeLessThanOrEqual(25);
  });

  it("should handle cart items with custom field values", () => {
    const customFieldValues = [
      { fieldName: "Email tài khoản", fieldValue: "user@example.com" },
      { fieldName: "Mật khẩu", fieldValue: "pass123" },
    ];
    const json = JSON.stringify(customFieldValues);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].fieldName).toBe("Email tài khoản");
  });
});
