import { endOfDay, format, parse, startOfDay } from "date-fns";
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
        stockRemaining: adjustmentLogs.stockRemaining,
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
}
