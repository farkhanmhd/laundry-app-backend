import { endOfDay, format, parse, startOfDay, startOfMonth } from "date-fns";
import {
  and,
  between,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  notInArray,
  sql,
  sum,
} from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { adjustmentLogs } from "@/db/schema/adjustment-logs";
import { user } from "@/db/schema/auth";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
import { restockLogs } from "@/db/schema/restock-logs";
import { services } from "@/db/schema/services";
import type { MovementReportItem } from "./inventory-movement";

export abstract class ReportService {
  // ─────────────────────────────────────────────────────────────────────────────
  // ADD THIS METHOD to the SalesService class in src/modules/sales/service.ts
  // Place it right after the existing getBestSellers() method.
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns all best-selling items for a date range WITHOUT pagination.
   * Used exclusively for PDF report generation.
   */
  static async getBestSellersForReport(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const itemIdSQL = sql<string>`COALESCE(${services.id}, ${inventories.id}, ${bundlings.id})`;
    const itemNameSQL =
      sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`.as(
        "itemName"
      );
    const itemPriceSQL =
      sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`.as(
        "itemPrice"
      );

    const filters = [
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"]),
      notInArray(orderItems.itemType, ["points", "voucher"]),
    ];

    const rows = await db
      .select({
        id: itemIdSQL.as("id"),
        itemName: itemNameSQL,
        itemType: orderItems.itemType,
        price: itemPriceSQL,
        totalUnitsSold: sum(orderItems.quantity)
          .mapWith(Number)
          .as("totalUnitsSold"),
        transactionCount: count(orders.id)
          .mapWith(Number)
          .as("transactionCount"),
        totalRevenue: sum(orderItems.subtotal)
          .mapWith(Number)
          .as("totalRevenue"),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(and(...filters))
      .groupBy(itemIdSQL, itemNameSQL, itemPriceSQL, orderItems.itemType)
      .orderBy(desc(sql`sum(${orderItems.subtotal})`));

    return rows;
  }

  /**
   * Returns sales by order for a date range WITHOUT pagination.
   * Used exclusively for PDF report generation.
   */
  static async getSalesByOrderForReport(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = [between(orders.createdAt, startString, endString)];

    const rows = await db
      .select({
        id: orders.id,
        member: members.name,
        totalItems: count(orderItems.id),
        paymentType: payments.paymentType,
        itemsTotal: sql<number>`${payments.total} + ${payments.discountAmount}`,
        discountAmount: payments.discountAmount,
        total: payments.total,
        amountPaid: payments.amountPaid,
        change: payments.change,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .leftJoin(members, eq(orders.memberId, members.id))
      .groupBy(
        orders.id,
        payments.total,
        payments.paymentType,
        payments.amountPaid,
        payments.discountAmount,
        payments.change,
        payments.createdAt,
        members.name
      )
      .where(
        and(
          ...filters,
          inArray(orders.status, ["processing", "ready", "completed"])
        )
      )
      .orderBy(desc(payments.createdAt));

    return rows;
  }

  /**
   * Returns inventory adjustment history for report WITHOUT pagination.
   */
  static async getAdjustmentHistoryForReport(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = [
      between(adjustmentLogs.createdAt, startDate, endDate),
      isNull(adjustmentLogs.orderId),
    ];

    const rows = await db
      .select({
        id: adjustmentLogs.id,
        inventoryName: inventories.name,
        change: adjustmentLogs.changeAmount,
        note: adjustmentLogs.note,
        actorName: user.name,
        createdAt: adjustmentLogs.createdAt,
      })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(and(...filters))
      .orderBy(desc(adjustmentLogs.createdAt));

    return rows;
  }

  /**
   * Returns inventory usage history for report WITHOUT pagination.
   */
  static async getUsageHistoryForReport(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = [
      between(adjustmentLogs.createdAt, startDate, endDate),
      isNotNull(adjustmentLogs.orderId),
    ];

    const rows = await db
      .select({
        id: adjustmentLogs.id,
        orderId: adjustmentLogs.orderId,
        inventoryName: inventories.name,
        change: adjustmentLogs.changeAmount,
        stockRemaining: adjustmentLogs.stockRemaining,
        actorName: user.name,
        createdAt: adjustmentLogs.createdAt,
      })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(and(...filters))
      .orderBy(desc(adjustmentLogs.createdAt));

    return rows;
  }

  /**
   * Returns restock history for report WITHOUT pagination.
   */
  static async getRestockHistoryForReport(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = [between(restockLogs.createdAt, startDate, endDate)];

    const rows = await db
      .select({
        id: restockLogs.id,
        inventoryName: inventories.name,
        restockQuantity: restockLogs.restockQuantity,
        stockRemaining: restockLogs.stockRemaining,
        supplier: restockLogs.supplier,
        note: restockLogs.note,
        actorName: user.name,
        createdAt: restockLogs.createdAt,
      })
      .from(restockLogs)
      .leftJoin(inventories, eq(restockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(restockLogs.userId, user.id))
      .where(and(...filters))
      .orderBy(desc(restockLogs.createdAt));

    return rows;
  }

  /**
   * Returns combined inventory timeline (restock + adjustment + usage)
   * sorted by time descending. Used exclusively for PDF report generation.
   */
  static async getMovementHistoryForReport(
    from: string,
    to: string,
    inventoryId: string
  ) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const restockFilters = and(
      between(restockLogs.createdAt, startDate, endDate),
      eq(restockLogs.inventoryId, inventoryId)
    );

    const adjustmentFilters = and(
      between(adjustmentLogs.createdAt, startDate, endDate),
      eq(adjustmentLogs.inventoryId, inventoryId)
    );

    const restockQuery = db
      .select({
        id: restockLogs.id,
        inventoryName: inventories.name,
        type: sql<string>`'restock'`.as("type"),
        changeAmount: restockLogs.restockQuantity,
        stockRemaining: restockLogs.stockRemaining,
        reference: sql<string | null>`${restockLogs.supplier}`,
        note: restockLogs.note,
        actorName: user.name,
        createdAt: restockLogs.createdAt,
      })
      .from(restockLogs)
      .leftJoin(inventories, eq(restockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(restockLogs.userId, user.id))
      .where(restockFilters);

    const adjustmentQuery = db
      .select({
        id: adjustmentLogs.id,
        inventoryName: inventories.name,
        type: sql<string>`CASE WHEN ${adjustmentLogs.orderId} IS NOT NULL OR ${adjustmentLogs.bundlingId} IS NOT NULL THEN 'usage' ELSE 'adjustment' END`.as(
          "type"
        ),
        changeAmount: adjustmentLogs.changeAmount,
        stockRemaining: adjustmentLogs.stockRemaining,
        reference: sql<
          string | null
        >`CASE WHEN ${adjustmentLogs.orderId} IS NOT NULL THEN ${adjustmentLogs.orderId} WHEN ${adjustmentLogs.bundlingId} IS NOT NULL THEN ${adjustmentLogs.bundlingId} END`,
        note: adjustmentLogs.note,
        actorName: user.name,
        createdAt: adjustmentLogs.createdAt,
      })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(adjustmentFilters);

    const rows = await unionAll(restockQuery, adjustmentQuery);

    return (rows as MovementReportItem[]).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  /**
   * Returns members with spending for report.
   * Used exclusively for PDF report generation.
   */
  static async getMembersWithSpendingForReport(
    from: string,
    to: string,
    rows = 50
  ) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = and(
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"])
    );

    const query = db
      .select({
        id: members.id,
        name: members.name,
        phone: members.phone,
        joinDate: members.createdAt,
        totalSpending: sum(payments.total),
        orderCount: count(orders.id),
        averageSpending:
          sql<number>`CAST(${sum(payments.total)} AS REAL) / NULLIF(CAST(${count(orders.id)} AS REAL), 0)`.mapWith(
            Number
          ),
      })
      .from(members)
      .innerJoin(orders, and(eq(members.id, orders.memberId), filters))
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .groupBy(members.id)
      .orderBy(desc(sql`COALESCE(${sum(payments.total)}, 0)`))
      .limit(rows);

    const rowsData = await query;

    return rowsData.map((member) => ({
      ...member,
      totalSpending: Number(member.totalSpending ?? 0),
      orderCount: Number(member.orderCount ?? 0),
      averageSpending: Math.round(member.averageSpending ?? 0),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Inventory: Monthly Report
  // ─────────────────────────────────────────────────────────────────────────────
  static async getInventoryMonthlyReport(month: string) {
    const parsed = parse(month, "MM-yyyy", new Date());
    const seriesStart = format(startOfMonth(parsed), "yyyy-MM-dd");

    const query = sql`
      WITH months AS (
        SELECT ${seriesStart}::date AS month_start
      ),
      inventory_list AS (
        SELECT id, name FROM inventories WHERE deleted_at IS NULL
      ),
      inventory_months AS (
        SELECT i.id, i.name, m.month_start
        FROM inventory_list i
        CROSS JOIN months m
      ),
      inventory_initial AS (
        SELECT
          i.id,
          (i.stock - COALESCE(r.total_restock_qty, 0) - COALESCE(a.total_adjustment, 0))::integer AS initial_stock,
          i.created_at
        FROM inventories i
        LEFT JOIN (
          SELECT inventory_id, SUM(restock_quantity)::integer AS total_restock_qty
          FROM restock_logs
          GROUP BY inventory_id
        ) r ON r.inventory_id = i.id
        LEFT JOIN (
          SELECT inventory_id, SUM(change_amount)::integer AS total_adjustment
          FROM adjustment_logs
          GROUP BY inventory_id
        ) a ON a.inventory_id = i.id
        WHERE i.deleted_at IS NULL
      ),
      all_logs AS (
        SELECT inventory_id, stock_remaining, created_at FROM restock_logs
        UNION ALL
        SELECT inventory_id, stock_remaining, created_at FROM adjustment_logs
        UNION ALL
        SELECT id AS inventory_id, initial_stock AS stock_remaining, created_at FROM inventory_initial
      ),
      first_log AS (
        SELECT DISTINCT ON (inventory_id)
          inventory_id, stock_remaining
        FROM all_logs
        ORDER BY inventory_id, created_at ASC
      ),
      initial_stock AS (
        SELECT DISTINCT ON (im.id, im.month_start)
          im.id, im.month_start,
          COALESCE(al.stock_remaining, fl.stock_remaining) AS stock_remaining
        FROM inventory_months im
        LEFT JOIN all_logs al ON al.inventory_id = im.id AND al.created_at < im.month_start + interval '1 day'
        LEFT JOIN first_log fl ON fl.inventory_id = im.id
        ORDER BY im.id, im.month_start, al.created_at DESC
      ),
      restock_summary AS (
        SELECT
          im.id, im.month_start,
          COALESCE(SUM(rl.restock_quantity), 0)::integer AS total_restocks
        FROM inventory_months im
        LEFT JOIN restock_logs rl ON rl.inventory_id = im.id
          AND rl.created_at >= im.month_start
          AND rl.created_at < im.month_start + interval '1 month'
        GROUP BY im.id, im.month_start
      ),
      usage_summary AS (
        SELECT
          im.id, im.month_start,
          COALESCE(SUM(al.change_amount), 0)::integer AS total_usage
        FROM inventory_months im
        LEFT JOIN adjustment_logs al ON al.inventory_id = im.id
          AND al.created_at >= im.month_start
          AND al.created_at < im.month_start + interval '1 month'
          AND (al.order_id IS NOT NULL OR al.bundling_id IS NOT NULL)
        GROUP BY im.id, im.month_start
      ),
      adjustment_summary AS (
        SELECT
          im.id, im.month_start,
          COALESCE(SUM(al.change_amount), 0)::integer AS total_adjustment
        FROM inventory_months im
        LEFT JOIN adjustment_logs al ON al.inventory_id = im.id
          AND al.created_at >= im.month_start
          AND al.created_at < im.month_start + interval '1 month'
          AND al.order_id IS NULL AND al.bundling_id IS NULL
        GROUP BY im.id, im.month_start
      )
      SELECT
        im.id,
        im.name,
        EXTRACT(MONTH FROM im.month_start)::integer AS month,
        EXTRACT(YEAR FROM im.month_start)::integer AS year,
        COALESCE(init.stock_remaining, 0)::integer AS initial_qty,
        COALESCE(r.total_restocks, 0)::integer AS total_restocks,
        COALESCE(u.total_usage, 0)::integer AS total_usage,
        COALESCE(a.total_adjustment, 0)::integer AS total_adjustment
      FROM inventory_months im
      LEFT JOIN initial_stock init ON init.id = im.id AND init.month_start = im.month_start
      LEFT JOIN restock_summary r ON r.id = im.id AND r.month_start = im.month_start
      LEFT JOIN usage_summary u ON u.id = im.id AND u.month_start = im.month_start
      LEFT JOIN adjustment_summary a ON a.id = im.id AND a.month_start = im.month_start
      ORDER BY im.month_start DESC, im.name
    `;

    const result = await db.execute(query);
    const rows = (
      Array.isArray(result) ? result : (result as { rows: unknown[] }).rows
    ) as Array<{
      id: string;
      name: string;
      month: number;
      year: number;
      initial_qty: number;
      total_restocks: number;
      total_usage: number;
      total_adjustment: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      inventoryName: row.name,
      month: Number(row.month),
      year: Number(row.year),
      initialQty: Number(row.initial_qty),
      totalRestocks: Number(row.total_restocks),
      totalUsage: Number(row.total_usage),
      totalAdjustment: Number(row.total_adjustment),
      finalQty:
        Number(row.initial_qty) +
        Number(row.total_restocks) +
        Number(row.total_usage) +
        Number(row.total_adjustment),
    }));
  }
}
