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
import { services } from "@/db/schema/services";
import { orderItems } from "@/db/schema/order-items";
import { bundlings } from "@/db/schema/bundlings";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";

export type OrderStatusData = {
  name: string;
  value: number;
};

export type TopServiceItem = {
  service: string;
  label: string;
  revenue: number;
};

export type InventoryUsageItem = {
  item: string;
  label: string;
  usage: number;
};

export type BundlingStatsItem = {
  bundle: string;
  label: string;
  sales: number;
};

export type OperationalMetrics = Awaited<ReturnType<typeof AdminDashboardService.getOperationalMetrics>>;
export type RecentDeliveryItem = Awaited<ReturnType<typeof AdminDashboardService.getRecentPickups>>[number];

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

  static async getOrderStatusData(
    from?: string,
    to?: string
  ): Promise<OrderStatusData[]> {
    const baseFilter =
      from && to
        ? AdminDashboardService.getBaseConditions(from, to)
        : undefined;

    const result = await db
      .select({
        name: orders.status,
        value: count(),
      })
      .from(orders)
      .where(baseFilter)
      .groupBy(orders.status);

    return result.map((row) => ({
      name: row.name,
      value: row.value,
    }));
  }

  static async fetchTopServices(
    from?: string,
    to?: string
  ): Promise<TopServiceItem[]> {
    const baseFilter =
      from && to
        ? AdminDashboardService.getBaseConditions(from, to)
        : undefined;

    const result = await db
      .select({
        service: services.id,
        label: services.name,
        revenue: sql<number>`SUM(${orderItems.subtotal})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(services, eq(orderItems.serviceId, services.id))
      .where(and(baseFilter, eq(orderItems.itemType, "service")))
      .groupBy(services.id, services.name)
      .orderBy(desc(sql`SUM(${orderItems.subtotal})`))
      .limit(5);

    return result.map((row) => ({
      service: row.service,
      label: row.label,
      revenue: Number(row.revenue),
    }));
  }

  static async fetchInventoryUsage(
    from?: string,
    to?: string
  ): Promise<InventoryUsageItem[]> {
    const baseFilter =
      from && to
        ? AdminDashboardService.getBaseConditions(from, to)
        : undefined;

    const result = await db
      .select({
        item: inventories.id,
        label: inventories.name,
        usage: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .where(and(baseFilter, eq(orderItems.itemType, "inventory")))
      .groupBy(inventories.id, inventories.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);

    return result.map((row) => ({
      item: row.item,
      label: row.label,
      usage: Number(row.usage),
    }));
  }

  static async fetchBundlingStats(
    from?: string,
    to?: string
  ): Promise<BundlingStatsItem[]> {
    const baseFilter =
      from && to
        ? AdminDashboardService.getBaseConditions(from, to)
        : undefined;

    const result = await db
      .select({
        bundle: bundlings.id,
        label: bundlings.name,
        sales: count(),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(and(baseFilter, eq(orderItems.itemType, "bundling")))
      .groupBy(bundlings.id, bundlings.name)
      .orderBy(desc(count()))
      .limit(5);

    return result.map((row) => ({
      bundle: row.bundle,
      label: row.label,
      sales: Number(row.sales),
    }));
  }

  static async getOperationalMetrics() {
    const [ordersPendingResult, ordersProcessingResult, pickupsPendingResult, deliveriesPendingResult] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(orders)
          .where(eq(orders.status, "pending")),

        db
          .select({ count: count() })
          .from(orders)
          .where(eq(orders.status, "processing")),

        db
          .select({ count: count() })
          .from(deliveries)
          .where(
            and(
              eq(deliveries.type, "pickup"),
              eq(deliveries.status, "requested")
            )
          ),

        db
          .select({ count: count() })
          .from(deliveries)
          .where(
            and(
              eq(deliveries.type, "delivery"),
              eq(deliveries.status, "requested")
            )
          ),
      ]);

    return {
      ordersPending: ordersPendingResult[0]?.count ?? 0,
      ordersProcessing: ordersProcessingResult[0]?.count ?? 0,
      pickupsPending: pickupsPendingResult[0]?.count ?? 0,
      deliveriesPending: deliveriesPendingResult[0]?.count ?? 0,
    };
  }

  static async getRecentPickups(limit = 3) {
    const rows = await db
      .select({
        id: deliveries.id,
        customer: members.name,
        address: addresses.address,
        requestedAt: deliveries.requestedAt,
        status: deliveries.status,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(deliveries.type, "pickup"))
      .orderBy(desc(deliveries.requestedAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      requestedAt: row.requestedAt ?? new Date().toISOString(),
    }));
  }

  static async getRecentDeliveries(limit = 3) {
    const rows = await db
      .select({
        id: deliveries.id,
        customer: members.name,
        address: addresses.address,
        requestedAt: deliveries.requestedAt,
        status: deliveries.status,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(deliveries.type, "delivery"))
      .orderBy(desc(deliveries.requestedAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      requestedAt: row.requestedAt ?? new Date().toISOString(),
    }));
  }
}
