import { desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { inventories } from "@/db/schema/inventories";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";

export abstract class AdminDashboardService {
  static async getLatestOrders(limit = 10) {
    const rows = await db
      .select({
        id: orders.id,
        customer: orders.customerName,
        total: payments.total,
        status: orders.status,
        date: orders.createdAt,
      })
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      total: row.total ?? 0,
      date: row.date ?? new Date().toISOString(),
    }));
  }

  static async getLowStockItems() {
    const rows = await db
      .select({
        id: inventories.id,
        name: inventories.name,
        current: inventories.stock,
        safety: inventories.safetyStock,
      })
      .from(inventories)
      .where(lt(inventories.stock, inventories.safetyStock));

    return rows;
  }
}
