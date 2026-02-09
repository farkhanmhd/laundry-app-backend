import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { services } from "@/db/schema/services";

const data = await db
  .select({
    // 1. Get the Name from the correct table
    orderId: orders.id,
    itemName: sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`,

    // 2. Get the Type (Service/Inventory/Bundling)
    itemType: orderItems.itemType,

    // 4. AGGREGATION: Sum of quantity and subtotal
    quantity: orderItems.quantity,
    subTotal: orderItems.subtotal,
    createdAt: orders.createdAt,
  })
  .from(orderItems)
  // Join to Orders to check Date and Status
  .innerJoin(orders, eq(orderItems.orderId, orders.id))

  // Join all possible item tables
  .leftJoin(services, eq(orderItems.serviceId, services.id))
  .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
  .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))

  .where(
    and(
      // Filter 1: The Date Range (Dynamic)
      // between(orders.createdAt, startDate, endDate),

      // Filter 2: Only Completed/Paid orders (adjust status as needed)
      // Usually you want 'processing', 'ready', 'completed'
      inArray(orders.status, ["processing", "ready", "completed"]),

      // Filter 3: Only relevant item types
      inArray(orderItems.itemType, ["service", "inventory", "bundling"])
    )
  )
  .orderBy(desc(orders.createdAt));
// GROUP BY Name and Type to merge duplicates
// Sort by highest revenue
// .orderBy(desc(sql`sum(${orderItems.subtotal})`));

console.table(data);
