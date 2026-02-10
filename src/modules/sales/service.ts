import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  between,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/db";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { redis } from "@/redis";
import type { GetBestSellerParams, GetSalesByOrderParams } from "./model";

type ItemType = (typeof orderItems.$inferSelect)["itemType"];
type PaymentType = (typeof payments.$inferSelect)["paymentType"];

export abstract class SalesService {
  /**
   * Helper: Base condition ensures we only look at completed orders within the date range.
   */
  private static getBaseConditions(from: string, to: string) {
    // 1. Parse "20-01-2026" to Date objects
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());

    // 2. Get the full start and end of the day (still Date objects)
    const startDate = startOfDay(parsedFrom);
    const endDate = endOfDay(parsedTo);

    // 3. FIX: Format them as strings so Drizzle accepts them
    // "2026-01-20 00:00:00"
    const startString = format(startDate, "yyyy-MM-dd HH:mm:ss");
    const endString = format(endDate, "yyyy-MM-dd HH:mm:ss");

    return and(
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"])
    );
  }

  static async getNetRevenue(from: string, to: string) {
    const result = await db
      .select({
        netRevenue: sum(payments.total).mapWith(Number),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .where(SalesService.getBaseConditions(from, to));

    return result[0]?.netRevenue ?? 0;
  }

  static async getGrossRevenue(from: string, to: string) {
    const result = await db
      .select({
        // Gross = Net + Discount
        grossRevenue:
          sql<number>`sum(${payments.total} + ${payments.discountAmount})`.mapWith(
            Number
          ),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .where(SalesService.getBaseConditions(from, to));

    return result[0]?.grossRevenue ?? 0;
  }

  static async getTotalTransactions(from: string, to: string) {
    const result = await db
      .select({
        count: count(orders.id),
      })
      .from(orders)
      .where(SalesService.getBaseConditions(from, to));

    return result[0]?.count ?? 0;
  }

  static async getAverageOrderValue(from: string, to: string) {
    const result = await db
      .select({
        avg: sql<number>`AVG(${payments.total})`.mapWith(Number),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .where(SalesService.getBaseConditions(from, to));

    return result[0]?.avg ?? 0;
  }

  static async getScorecardData(from: string, to: string) {
    const result = await db
      .select({
        netRevenue: sum(payments.total).mapWith(Number),
        grossRevenue:
          sql<number>`sum(${payments.total} + ${payments.discountAmount})`.mapWith(
            Number
          ),
        transactionCount: count(orders.id),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .where(SalesService.getBaseConditions(from, to));

    const data = result[0];
    const gross = data?.grossRevenue ?? 0;
    const net = data?.netRevenue ?? 0;
    const txCount = data?.transactionCount ?? 0;

    // Calculate Average Order Value manually from the aggregates
    const avgOrderValue = txCount > 0 ? net / txCount : 0;

    return {
      netRevenue: net,
      grossRevenue: gross,
      transactionCount: txCount,
      avgOrderValue,
    };
  }

  static async getChartData(from: string, to: string) {
    // 1. Parse dates (reusing your logic)
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    // 2. Aggregate Query
    const rows = await db
      .select({
        // Group Key: Format date as "dd-MM-yyyy"
        date: sql<string>`to_char(${orders.createdAt}, 'DD-MM-YYYY')`,

        // Metrics
        net: sum(payments.total).mapWith(Number),
        discount: sum(payments.discountAmount).mapWith(Number),
        // Gross = Net + Discount
        gross:
          sql<number>`sum(${payments.total} + ${payments.discountAmount})`.mapWith(
            Number
          ),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .where(
        and(
          between(orders.createdAt, startString, endString),
          inArray(orders.status, ["processing", "ready", "completed"])
        )
      )
      .groupBy(sql`to_char(${orders.createdAt}, 'DD-MM-YYYY')`) // Group by day
      .orderBy(sql`min(${orders.createdAt})`); // Order chronologically

    return rows;
  }

  static async getBestSellers({
    from,
    to,
    page = 1,
    rows = 50,
    search,
    item_id,
    item_type,
  }: GetBestSellerParams) {
    // 1. Parse Dates
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    // 2. Define SQL Definitions
    const itemIdSQL = sql<string>`COALESCE(${services.id}, ${inventories.id}, ${bundlings.id})`;
    const itemNameSQL =
      sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`.as(
        "itemName"
      );
    const itemPriceSQL =
      sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`.as(
        "itemPrice"
      );

    // 3. Build Shared Filters
    const filters = [
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"]),
    ];

    if (search) {
      filters.push(ilike(itemNameSQL, `%${search}%`));
    }

    if (item_type) {
      if (Array.isArray(item_type)) {
        filters.push(inArray(orderItems.itemType, item_type as ItemType[]));
      } else {
        filters.push(eq(orderItems.itemType, item_type as ItemType));
      }
    } else {
      filters.push(notInArray(orderItems.itemType, ["points", "voucher"]));
    }

    if (item_id) {
      if (Array.isArray(item_id)) {
        filters.push(inArray(itemIdSQL, item_id));
      } else {
        filters.push(eq(itemIdSQL, item_id));
      }
    }

    // 4. Construct the Base Query (Subquery for safe counting)
    const baseQuery = db
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
      .as("sq");

    // 5. Execute Data Query
    const dataQueryPromise = db
      .select()
      .from(baseQuery)
      .orderBy(desc(baseQuery.totalRevenue))
      .limit(rows)
      .offset((page - 1) * rows);

    // 6. Execute Count Query
    const countQueryPromise = db.select({ total: count() }).from(baseQuery);

    const [data, countResult] = await Promise.all([
      dataQueryPromise,
      countQueryPromise,
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      items: data,
      meta: {
        total,
        page,
        rows,
        totalPages: Math.ceil(total / rows),
      },
    };
  }

  static async getSalesByOrder({
    from,
    to,
    payment_type,
    page = 1,
    rows = 50,
  }: GetSalesByOrderParams) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    const filters = [between(orders.createdAt, startDate, endDate)];

    if (payment_type) {
      if (Array.isArray(payment_type)) {
        const filteredPaymentType = payment_type.filter(
          (type) => type !== null
        );
        filters.push(
          inArray(
            payments.paymentType,
            filteredPaymentType as NonNullable<PaymentType>[]
          )
        );
      } else {
        filters.push(
          eq(payments.paymentType, payment_type as NonNullable<PaymentType>)
        );
      }
    }

    const dataPromise = db
      .select({
        id: orders.id,
        totalItems: count(orderItems.id),
        paymentType: payments.paymentType,
        itemsTotal: sql`${payments.total} + ${payments.discountAmount}`,
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
        payments.createdAt
      )
      .where(and(...filters))
      .orderBy(desc(payments.createdAt))
      .limit(rows)
      .offset((page - 1) * rows);

    const totalRowsPromise = db
      .select({ count: count() })
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
        payments.createdAt
      )
      .where(and(...filters));

    const [data, totalRowsResult] = await Promise.all([
      dataPromise,
      totalRowsPromise,
    ]);

    const total = totalRowsResult[0]?.count ?? 0;

    return {
      items: data,
      meta: {
        total,
        page,
        rows,
        totalPages: Math.ceil(total / rows),
      },
    };
  }

  static async getItemLogs({
    from,
    to,
    page = 1,
    rows = 50,
    search,
    item_id,
    item_type,
  }: GetBestSellerParams) {
    // 1. Parse Dates
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startString = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
    const endString = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");

    // 2. Define SQL Definitions
    const itemIdSQL = sql<string>`COALESCE(${services.id}, ${inventories.id}, ${bundlings.id})`;
    const itemNameSQL = sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`;

    // 3. Build Shared Filters
    const filters = [
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"]),
    ];

    if (search) {
      filters.push(ilike(itemNameSQL, `%${search}%`));
    }

    if (item_type) {
      if (Array.isArray(item_type)) {
        filters.push(inArray(orderItems.itemType, item_type as ItemType[]));
      } else {
        filters.push(eq(orderItems.itemType, item_type as ItemType));
      }
    } else {
      // Default to not showing points/voucher redemptions as "items"
      filters.push(notInArray(orderItems.itemType, ["points", "voucher"]));
    }

    if (item_id) {
      if (Array.isArray(item_id)) {
        filters.push(inArray(itemIdSQL, item_id));
      } else {
        filters.push(eq(itemIdSQL, item_id));
      }
    }

    // 4. Construct the Base Query (Subquery for safe counting)
    const dataQuery = db
      .select({
        id: orderItems.id,
        orderId: orders.id,
        itemName: itemNameSQL.as("itemName"), // Use alias here
        itemType: orderItems.itemType,
        quantity: orderItems.quantity,
        createdAt: orders.createdAt,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(and(...filters))
      .orderBy(desc(orders.createdAt))
      .limit(rows)
      .offset((page - 1) * rows);

    // 6. Execute Count Query
    const countQueryPromise = db
      .select({ total: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(and(...filters));

    const [data, countResult] = await Promise.all([
      dataQuery,
      countQueryPromise,
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      items: data,
      meta: {
        total,
        page,
        rows,
        totalPages: Math.ceil(total / rows),
      },
    };
  }

  static async getOrderItemOptions() {
    const cachedData = await redis.get("orderItemOptions");

    if (cachedData) {
      return JSON.parse(cachedData) as Array<{ value: string; label: string }>;
    }

    const itemIdSQL = sql<string>`COALESCE(${services.id}, ${inventories.id}, ${bundlings.id})`;
    const itemNameSQL = sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`;

    const result = await db
      .select({
        value: itemIdSQL.as("itemId"),
        label: itemNameSQL.as("itemName"),
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(inArray(orderItems.itemType, ["service", "inventory", "bundling"]))
      .groupBy(itemIdSQL, itemNameSQL);

    await redis.set("orderItemOptions", JSON.stringify(result), "EX", 3600);

    return result;
  }
}
