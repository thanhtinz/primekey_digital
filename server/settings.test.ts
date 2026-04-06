import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getUserSettings: vi.fn(),
  upsertUserSettings: vi.fn(),
  getUserById: vi.fn(),
  getDb: vi.fn(),
}));

import * as db from "./db";

describe("Settings Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserSettings returns null when no settings exist", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue(undefined);
    const result = await db.getUserSettings(1);
    expect(result).toBeUndefined();
    expect(db.getUserSettings).toHaveBeenCalledWith(1);
  });

  it("upsertUserSettings creates new settings", async () => {
    vi.mocked(db.upsertUserSettings).mockResolvedValue({} as any);
    await db.upsertUserSettings(1, {
      companyName: "Test Company",
      companyEmail: "test@company.com",
    });
    expect(db.upsertUserSettings).toHaveBeenCalledWith(1, {
      companyName: "Test Company",
      companyEmail: "test@company.com",
    });
  });

  it("upsertUserSettings updates existing settings", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue({
      id: 1,
      userId: 1,
      companyName: "Old Company",
      companyEmail: "old@company.com",
      companyPhone: null,
      companyAddress: null,
      taxId: null,
      website: null,
      emailNotifications: true,
      invoiceReminder: true,
      paymentConfirmation: true,
      weeklyReport: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.upsertUserSettings).mockResolvedValue({} as any);

    await db.upsertUserSettings(1, { companyName: "New Company" });
    expect(db.upsertUserSettings).toHaveBeenCalledWith(1, { companyName: "New Company" });
  });

  it("getUserSettings returns settings when they exist", async () => {
    const mockSettings = {
      id: 1,
      userId: 1,
      companyName: "Invoice Prime",
      companyEmail: "info@invoiceprime.com",
      companyPhone: "0123456789",
      companyAddress: "123 Test Street",
      taxId: "0123456789",
      website: "https://invoiceprime.com",
      emailNotifications: true,
      invoiceReminder: true,
      paymentConfirmation: true,
      weeklyReport: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.getUserSettings).mockResolvedValue(mockSettings);

    const result = await db.getUserSettings(1);
    expect(result).toEqual(mockSettings);
    expect(result?.companyName).toBe("Invoice Prime");
  });

  it("notification settings can be updated independently", async () => {
    vi.mocked(db.upsertUserSettings).mockResolvedValue({} as any);
    await db.upsertUserSettings(1, {
      emailNotifications: false,
      weeklyReport: true,
    });
    expect(db.upsertUserSettings).toHaveBeenCalledWith(1, {
      emailNotifications: false,
      weeklyReport: true,
    });
  });
});
