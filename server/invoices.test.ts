import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getInvoicesByUserId: vi.fn(),
  getInvoiceById: vi.fn(),
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
}));

describe("Invoices Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInvoicesByUserId", () => {
    it("should return invoices for a user", async () => {
      const mockInvoices = [
        {
          id: 1,
          invoiceNumber: "INV001",
          customerId: 1,
          userId: 1,
          status: "PAID",
          currency: "VND",
          subtotal: "1000000",
          taxAmount: "100000",
          discountAmount: "0",
          totalAmount: "1100000",
          createdAt: new Date(),
          expiresAt: null,
          paidAt: null,
          notes: null,
          templateId: null,
          paymentUrl: null,
          paymentTransactionId: null,
          customerName: null,
          customerEmail: null,
        },
      ];

      vi.mocked(db.getInvoicesByUserId).mockResolvedValue(mockInvoices);

      const result = await db.getInvoicesByUserId(1);

      expect(result).toEqual(mockInvoices);
      expect(db.getInvoicesByUserId).toHaveBeenCalledWith(1);
    });

    it("should return empty array when no invoices exist", async () => {
      vi.mocked(db.getInvoicesByUserId).mockResolvedValue([]);

      const result = await db.getInvoicesByUserId(1);

      expect(result).toEqual([]);
    });
  });

  describe("getInvoiceById", () => {
    it("should return a single invoice", async () => {
      const mockInvoice = {
        id: 1,
        invoiceNumber: "INV001",
        customerId: 1,
        userId: 1,
        status: "PAID",
        currency: "VND",
        subtotal: "1000000",
        taxAmount: "100000",
        discountAmount: "0",
        totalAmount: "1100000",
        createdAt: new Date(),
        expiresAt: null,
        paidAt: null,
        notes: null,
        templateId: null,
        paymentUrl: null,
        paymentTransactionId: null,
        customerName: null,
        customerEmail: null,
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice);

      const result = await db.getInvoiceById(1);

      expect(result).toEqual(mockInvoice);
      expect(db.getInvoiceById).toHaveBeenCalledWith(1);
    });

    it("should return undefined when invoice not found", async () => {
      vi.mocked(db.getInvoiceById).mockResolvedValue(undefined);

      const result = await db.getInvoiceById(999);

      expect(result).toBeUndefined();
    });
  });

  describe("createInvoice", () => {
    it("should create a new invoice", async () => {
      const invoiceData = {
        invoiceNumber: "INV002",
        customerId: 1,
        userId: 1,
        status: "PENDING",
        currency: "VND",
        subtotal: 2000000,
        taxAmount: 200000,
        discountAmount: 0,
        totalAmount: 2200000,
      };

      vi.mocked(db.createInvoice).mockResolvedValue({ insertId: 2 } as any);

      const result = await db.createInvoice(invoiceData);

      expect(result).toEqual({ insertId: 2 });
      expect(db.createInvoice).toHaveBeenCalledWith(invoiceData);
    });
  });

  describe("updateInvoice", () => {
    it("should update an existing invoice", async () => {
      const updateData = {
        status: "PAID",
        paidAt: new Date(),
      };

      vi.mocked(db.updateInvoice).mockResolvedValue({ changes: 1 } as any);

      const result = await db.updateInvoice(1, updateData);

      expect(result).toEqual({ changes: 1 });
      expect(db.updateInvoice).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe("deleteInvoice", () => {
    it("should delete an invoice", async () => {
      vi.mocked(db.deleteInvoice).mockResolvedValue({ changes: 1 } as any);

      const result = await db.deleteInvoice(1);

      expect(result).toEqual({ changes: 1 });
      expect(db.deleteInvoice).toHaveBeenCalledWith(1);
    });
  });
});
