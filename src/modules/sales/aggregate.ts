import {
  and,
  count,
  desc,
  eq,
  inArray,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/db";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { services } from "@/db/schema/services";

// Define the grouping logic once to reuse in select & groupBy to avoid SQL errors
const itemIdSQL = sql<string>`COALESCE(${services.id}, ${inventories.id}, ${bundlings.id})`
const itemNameSQL = sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`;
const itemPriceSQL = sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`

const data = await db
  .select({
    // 1. Identity
    itemId: itemIdSQL,
    itemName: itemNameSQL,
    itemType: orderItems.itemType,
    price: itemPriceSQL,

    // 2. Metric: How many UNITS were sold? (e.g., 50 kg total)
    totalUnitsSold: sum(orderItems.quantity).mapWith(Number),

    // 3. Metric: How many ORDERS contained this item? (e.g., appeared in 12 receipts)
    // This answers your specific question
    transactionCount: count(orders.id).mapWith(Number),

    // 4. Metric: How much money did it make?
    totalRevenue: sum(orderItems.subtotal).mapWith(Number),
  })
  .from(orderItems)
  .innerJoin(orders, eq(orderItems.orderId, orders.id))
  // Left joins to resolve the name regardless of type
  .leftJoin(services, eq(orderItems.serviceId, services.id))
  .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
  .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
  .where(
    and(
      // Filter 1: Status (Completed sales only)
      inArray(orders.status, ["processing", "ready", "completed"]),

      // Filter 2: Valid item types only
      inArray(orderItems.itemType, ["service", "inventory", "bundling"])

      // Filter 3: Date Range (Uncomment when needed)
      // between(orders.createdAt, from, to),
    )
  )
  // Group by the Name and Type so distinct items don't merge incorrectly
  .groupBy(itemIdSQL, itemNameSQL, itemPriceSQL, orderItems.itemType)
  // Sort by 'Best Sellers' (Highest Revenue first)
  .orderBy(desc(sum(orderItems.subtotal)));

console.table(data);
