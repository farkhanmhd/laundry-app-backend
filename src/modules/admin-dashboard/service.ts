import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  between,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
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
      .where(gt(inventories.safetyStock, inventories.stock));

    return rows;
  }

  private static getBaseConditions(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());

    const startDate = startOfDay(parsedFrom);
    const endDate = endOfDay(parsedTo);

    const startString = format(startDate, "yyyy-MM-dd HH:mm:ss");
    const endString = format(endDate, "yyyy-MM-dd HH:mm:ss");

    return between(orders.createdAt, startString, endString);
  }

  static async getDashboardMetrics(from?: string, to?: string) {
    const baseFilter =
      from && to
        ? AdminDashboardService.getBaseConditions(from, to)
        : undefined;

    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.total}), 0)`,
      })
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(
        and(
          baseFilter,
          inArray(orders.status, ["completed", "processing", "ready"])
        )
      );

    const ordersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(baseFilter);

    const activeMembersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${orders.memberId})` })
      .from(orders)
      .where(and(baseFilter, isNotNull(orders.memberId)));

    const staffResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));

    return {
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalOrders: ordersResult[0]?.count ?? 0,
      activeMembers: activeMembersResult[0]?.count ?? 0,
      totalStaff: staffResult[0]?.count ?? 0,
    };
  }
}
