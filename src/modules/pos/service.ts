import { sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { orders } from "@/db/schema/orders";
import { services as servicesTable } from "@/db/schema/services";
import { redis } from "@/redis";
import {
  getPricesQuery,
  type ItemPrice,
  insertOrderItemsQuery,
  insertPaymentQuery,
  reduceOrderInventoryQty,
} from "@/utils/orders";
import { INVENTORIES_CACHE_KEY } from "../inventories/service";
import type { NewPosOrderSchema, PosItem } from "./model";

const POS_CACHE_KEY = "pos:all";

export abstract class Pos {
  static async getPosItems() {
    const json = await redis.get(POS_CACHE_KEY);

    if (json) {
      return JSON.parse(json) as PosItem[];
    }

    const inventories = db
      .select({
        id: inventoriesTable.id,
        name: inventoriesTable.name,
        description: inventoriesTable.description,
        price: inventoriesTable.price,
        image: inventoriesTable.image,
        stock: sql<number | null>`${inventoriesTable.stock}`.as("stock"),
        itemType: sql<string>`'inventory'`.as("item_type"),
      })
      .from(inventoriesTable);
    const services = db
      .select({
        id: servicesTable.id,
        name: servicesTable.name,
        description: servicesTable.description,
        price: servicesTable.price,
        image: servicesTable.image,
        stock: sql<number | null>`null`.as("stock"),
        itemType: sql<string>`'service'`.as("item_type"),
      })
      .from(servicesTable);
    const bundlings = db
      .select({
        id: bundlingsTable.id,
        name: bundlingsTable.name,
        description: bundlingsTable.description,
        price: bundlingsTable.price,
        image: bundlingsTable.image,
        stock: sql<number | null>`null`.as("stock"),
        itemType: sql<string>`'bundling'`.as("item_type"),
      })
      .from(bundlingsTable);

    const rows = await unionAll(inventories, services, bundlings);

    await redis.set(POS_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }

  static async newPosOrder(body: NewPosOrderSchema, userId: string) {
    const { customerName, items, ...restBody } = body;

    const newOrderId = await db.transaction(async (tx) => {
      // insert and return order id
      const orderId = (
        await tx
          .insert(orders)
          .values({
            customerName,
            memberId: restBody.memberId ? restBody.memberId : null,
            userId,
            status: "processing",
          })
          .returning({ id: orders.id })
      )[0]?.id as string;

      // get price query of each item based on item id of order item
      const priceQueries = [
        getPricesQuery(tx, inventoriesTable, items, "inventoryId"),
        getPricesQuery(tx, servicesTable, items, "serviceId"),
        getPricesQuery(tx, bundlingsTable, items, "bundlingId"),
      ].filter((q): q is NonNullable<typeof q> => q !== null);

      // execute all price query at once
      const itemPrices: ItemPrice[] = await unionAll(
        ...(priceQueries as unknown as Parameters<typeof unionAll>)
      );

      // insert order items to database
      const orderItemsResult = await insertOrderItemsQuery(
        tx,
        orderId,
        items,
        itemPrices
      );

      // total price of an order
      const totalPrice = orderItemsResult.reduce(
        (acc, curr) => curr.subtotal + acc,
        0
      );

      await insertPaymentQuery(tx, totalPrice, orderId, restBody);

      // reduce quantity after making orders
      await reduceOrderInventoryQty(tx, items);

      return orderId;
    });

    await redis.del(POS_CACHE_KEY);
    await redis.del(INVENTORIES_CACHE_KEY);
    return newOrderId;
  }
}
