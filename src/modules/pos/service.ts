import { and, eq, gt, ilike, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { members as membersTable } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { services as servicesTable } from "@/db/schema/services";
import { vouchers } from "@/db/schema/vouchers";
import { redis } from "@/redis";
import type { SearchQuery } from "@/search-query";
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

  static async getPosMembers(query: SearchQuery) {
    const { search } = query;

    if (!search) {
      return [];
    }

    const members = await db
      .select({
        id: membersTable.id,
        name: membersTable.name,
        phone: membersTable.phone,
        points: membersTable.points,
      })
      .from(membersTable)
      .where(ilike(membersTable.phone, `%${search}%`))
      .orderBy(membersTable.name)
      .limit(5);

    return members;
  }

  static async getPosVouchers() {
    const whereQuery = and(
      eq(vouchers.isActive, true),
      eq(vouchers.isVisible, true),
      gt(vouchers.expiresAt, sql`now()`)
    );
    const rows = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        description: vouchers.name,
        discountAmount: vouchers.discountAmount,
        pointsCost: vouchers.pointsCost,
        expiryDate: vouchers.expiresAt,
      })
      .from(vouchers)
      .where(whereQuery);

    return rows;
  }

  static async newPosOrder(body: NewPosOrderSchema, userId: string) {
    const { customerName, items, ...restBody } = body;

    const onlyInventoryItems = !items.find(
      (item) =>
        item.itemType === "service" ||
        item.itemType === "bundling" ||
        item.itemType === "voucher"
    );

    const newOrderId = await db.transaction(async (tx) => {
      // add new member
      let newMemberId = "";
      if (
        restBody.newMember &&
        customerName &&
        restBody.phone &&
        !restBody.memberId
      ) {
        newMemberId = (
          await tx
            .insert(membersTable)
            .values({ name: customerName, phone: restBody.phone })
            .returning({ id: membersTable.id })
        )[0]?.id as string;
      }

      const selectedMemberId = restBody.newMember
        ? newMemberId
        : restBody.memberId;

      // insert and return order id
      const orderId = (
        await tx
          .insert(orders)
          .values({
            customerName,
            memberId: selectedMemberId,
            userId,
            status: onlyInventoryItems ? "completed" : "processing",
          })
          .returning({ id: orders.id })
      )[0]?.id as string;

      // get price query of each item based on item id of order item
      const priceQueries = [
        getPricesQuery(tx, inventoriesTable, items, "inventoryId"),
        getPricesQuery(tx, servicesTable, items, "serviceId"),
        getPricesQuery(tx, bundlingsTable, items, "bundlingId"),
      ].filter((q): q is NonNullable<typeof q> => q !== null);

      const itemPrices = (await Promise.all(priceQueries))
        .flat()
        .filter(
          (price): price is NonNullable<typeof price> => price !== null
        ) as ItemPrice[];

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
