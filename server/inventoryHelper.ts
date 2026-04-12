/**
 * inventoryHelper.ts
 * Helper: tự động lấy mục kho (warehouse) và gán vào đơn hàng khi thanh toán thành công.
 * Được gọi từ webhooks.ts (PayOS webhook) và routers.ts (updateOrderStatus PAID).
 */

import * as db from "./db";

/**
 * Tự động gán mục kho cho đơn hàng khi thanh toán thành công.
 * - Lấy tất cả invoiceItems của đơn hàng
 * - Với mỗi item có packageId và gói deliveryType=warehouse:
 *   - Lấy đúng số lượng mục kho status=available theo packageId
 *   - Update status → reserved, gán assignedOrderId
 * - Lưu dữ liệu kho đã giao vào invoices.deliveredData (JSON)
 * - Gọi checkLowStock sau khi gán
 */
export async function autoAssignInventory(invoiceId: number): Promise<void> {
  try {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return;

    const { invoiceItems, productPackages, productInventory, invoices } = await import("../drizzle/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // Kiểm tra xem đã gán kho chưa (tránh gán 2 lần)
    const [inv] = await drizzleDb.select({ deliveredData: (invoices as any).deliveredData }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (inv?.deliveredData) {
      console.log(`[autoAssignInventory] Invoice ${invoiceId} already has deliveredData, skipping`);
      return;
    }

    // Lấy tất cả invoice items
    const items = await drizzleDb.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    if (items.length === 0) return;

    const deliveredEntries: Array<{ inventoryId: number; packageId: number; stockData: string; itemName: string }> = [];

    for (const item of items) {
      const pkgId = (item as any).packageId as number | null;
      if (!pkgId) continue;

      // Kiểm tra gói có deliveryType=warehouse không
      const [pkg] = await drizzleDb.select().from(productPackages).where(eq(productPackages.id, pkgId)).limit(1);
      if (!pkg || (pkg as any).deliveryType !== "warehouse") continue;

      const qty = Math.max(1, Math.round(parseFloat(String(item.quantity)) || 1));

      // Lấy đúng qty mục kho available
      const availableItems = await drizzleDb
        .select()
        .from(productInventory)
        .where(and(eq(productInventory.packageId, pkgId), eq(productInventory.status, "available")))
        .limit(qty);

      if (availableItems.length === 0) {
        console.warn(`[autoAssignInventory] No available inventory for packageId=${pkgId} (invoice ${invoiceId})`);
        continue;
      }

      // Gán từng mục kho
      for (const invItem of availableItems) {
        await drizzleDb.update(productInventory).set({
          status: "used",
          assignedOrderId: invoiceId,
          assignedAt: new Date(),
        } as any).where(eq(productInventory.id, invItem.id));

        deliveredEntries.push({
          inventoryId: invItem.id,
          packageId: pkgId,
          stockData: invItem.stockData,
          itemName: item.name,
        });
      }
    }

    if (deliveredEntries.length > 0) {
      // Lưu deliveredData vào invoice
      await drizzleDb.update(invoices).set({
        deliveredData: JSON.stringify(deliveredEntries),
      } as any).where(eq(invoices.id, invoiceId));

      console.log(`[autoAssignInventory] Assigned ${deliveredEntries.length} inventory items to invoice ${invoiceId}`);

      // Gọi checkLowStock
      try {
        const { notifyOwner } = await import("./_core/notification");
        const checkedPkgs = new Set<number>();
        for (const entry of deliveredEntries) {
          if (checkedPkgs.has(entry.packageId)) continue;
          checkedPkgs.add(entry.packageId);
          const [pkg] = await drizzleDb.select().from(productPackages).where(eq(productPackages.id, entry.packageId)).limit(1);
          if (!pkg) continue;
          const threshold = (pkg as any).minStockThreshold ?? 5;
          const { products } = await import("../drizzle/schema");
          const [countRow] = await drizzleDb.select({ cnt: sql<number>`COUNT(*)` }).from(productInventory)
            .where(and(eq(productInventory.packageId, entry.packageId), eq(productInventory.status, "available")));
          const available = Number(countRow?.cnt ?? 0);
          if (available <= threshold) {
            const [product] = await drizzleDb.select({ name: products.name }).from(products).where(eq(products.id, pkg.productId)).limit(1);
            await notifyOwner({
              title: `⚠️ Kho sắp hết: ${product?.name ?? ""} - ${pkg.name}`,
              content: `Gói "${pkg.name}" còn ${available} mục (ngưỡng: ${threshold}). Hãy nhập thêm hàng.`,
            }).catch(() => {});
          }
        }
      } catch (lsErr) {
        console.error("[autoAssignInventory] checkLowStock error:", lsErr);
      }
    }
  } catch (err) {
    console.error("[autoAssignInventory] Error:", err);
  }
}
