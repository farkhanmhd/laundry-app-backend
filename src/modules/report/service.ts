import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  between,
  count,
  desc,
  eq,
  inArray,
  notInArray,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/db";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { services } from "@/db/schema/services";

export abstract class ReportService {
  // ─────────────────────────────────────────────────────────────────────────────
  // ADD THIS METHOD to the SalesService class in src/modules/sales/service.ts
  // Place it right after the existing getBestSellers() method.
  // ─────────────────────────────────────────────────────────────────────────────
  //
  // Also add these imports at the top of service.ts if not already present:
  //   import { endOfDay, format, parse, startOfDay } from "date-fns";
  //   import { and, between, desc, eq, ilike, inArray, notInArray, sql, sum, count } from "drizzle-orm";
  //   import { bundlings } from "@/db/schema/bundlings";
  //   import { inventories } from "@/db/schema/inventories";
  //   import { orderItems } from "@/db/schema/order-items";
  //   import { orders } from "@/db/schema/orders";
  //   import { services } from "@/db/schema/services";

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
}
