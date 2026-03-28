import { and, eq, gt, ilike, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { members as membersTable } from "@/db/schema/members";
import { services as servicesTable } from "@/db/schema/services";
import { vouchers } from "@/db/schema/vouchers";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type { SearchQuery } from "@/search-query";
import type { Transaction } from "@/utils";
import {
  determineOrderStatus,
  getPricesQuery,
  getVoucherData,
  getVoucherDiscountAmount,
  type ItemPrice,
  insertNewMember,
  insertNewOrder,
  insertOrderItemPoint,
  insertOrderItemsQuery,
  insertOrderVoucher,
  insertPaymentQuery,
  insertRedemptionHistory,
  type PosVoucher,
  reduceMemberPoint,
  reduceOrderInventoryQty,
  updateEarnedPoints,
} from "@/utils/orders";
import { INVENTORIES_CACHE_KEY } from "../inventories/service";
import type { NewPosOrderSchema, PosItem } from "./model";

export const POS_CACHE_KEY = "pos:all";

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
      eq(vouchers.isVisible, true),
      gt(vouchers.expiresAt, sql`now()`)
    );
    const rows = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        description: vouchers.description,
        discountPercentage: vouchers.discountPercentage,
        discountAmount: vouchers.discountAmount,
        minSpend: vouchers.minSpend,
        maxDiscountAmount: vouchers.maxDiscountAmount,
        expiresAt: vouchers.expiresAt,
      })
      .from(vouchers)
      .where(whereQuery);

    return rows;
  }

  static async getVoucherByCode(voucherCode: string) {
    const whereQuery = and(
      eq(vouchers.code, voucherCode),
      gt(vouchers.expiresAt, sql`now()`)
    );

    const rows = await db
      .select({
        id: vouchers.id,
        code: vouchers.code,
        description: vouchers.description,
        discountPercentage: vouchers.discountPercentage,
        discountAmount: vouchers.discountAmount,
        minSpend: vouchers.minSpend,
        maxDiscountAmount: vouchers.maxDiscountAmount,
        expiresAt: vouchers.expiresAt,
      })
      .from(vouchers)
      .where(whereQuery)
      .limit(1);

    if (!rows.length) {
      throw new NotFoundError("Voucher Code Not Found");
    }

    return rows[0];
  }

  protected static async _determineMemberId(
    tx: Transaction,
    body: NewPosOrderSchema
  ): Promise<string | null> {
    const newMemberId =
      body.newMember && body.customerName && body.phone && !body.memberId
        ? ((await insertNewMember(tx, {
            name: body.customerName,
            phone: `+62${body.phone}`,
          })) as string)
        : null;

    return body.newMember ? newMemberId : (body.memberId ?? null);
  }

  protected static async _processOrderItems(
    tx: Transaction,
    data: {
      items: NewPosOrderSchema["items"];
      orderId: string;
    }
  ): Promise<{ totalItemPrice: number; itemPrices: ItemPrice[] }> {
    const { items, orderId } = data;
    const priceQueries = [
      getPricesQuery(tx, {
        table: inventoriesTable,
        items,
        key: "inventoryId",
      }),
      getPricesQuery(tx, { table: servicesTable, items, key: "serviceId" }),
      getPricesQuery(tx, { table: bundlingsTable, items, key: "bundlingId" }),
    ].filter((q): q is NonNullable<typeof q> => q !== null);

    const itemPrices = (await Promise.all(priceQueries))
      .flat()
      .filter((price): price is NonNullable<typeof price> => price !== null)
      .filter(
        (item): item is ItemPrice =>
          item !== null && item.id !== null && item.price !== null
      );

    const orderItems = items.filter(
      (item) => !(item.voucherId || item.itemType === "points")
    );

    const orderItemsResult = await insertOrderItemsQuery(tx, {
      orderId,
      items: orderItems,
      itemPrices,
    });

    const totalItemPrice = orderItemsResult.reduce(
      (acc, curr) => curr.subtotal + acc,
      0
    );

    return { totalItemPrice, itemPrices };
  }

  protected static async _handleVouchers(
    tx: Transaction,
    data: {
      items: NewPosOrderSchema["items"];
      orderId: string;
      selectedMemberId: string | null | undefined;
      totalItemPrice: number;
    }
  ): Promise<{
    voucherDiscountAmount: number;
    voucher?: PosVoucher | undefined;
  }> {
    const { items, orderId, selectedMemberId, totalItemPrice } = data;
    const voucherId = items.find((item) => item.voucherId)?.voucherId || "";
    if (!voucherId) {
      return { voucherDiscountAmount: 0 };
    }
    const voucher = await getVoucherData(tx, voucherId);
    if (!voucher) {
      return { voucherDiscountAmount: 0 };
    }

    const voucherDiscountAmount = getVoucherDiscountAmount(
      voucher,
      totalItemPrice
    );

    if (voucher && orderId && selectedMemberId) {
      await insertOrderVoucher(tx, {
        voucher,
        discountAmount: voucherDiscountAmount,
        orderId,
      });

      await insertRedemptionHistory(tx, {
        memberId: selectedMemberId,
        voucherId,
        orderId,
      });
    }

    return { voucherDiscountAmount, voucher };
  }

  protected static async _handlePoints(
    tx: Transaction,
    data: {
      body: NewPosOrderSchema;
      selectedMemberId: string | null | undefined;
      orderId: string;
      totalItemPrice: number;
    }
  ): Promise<void> {
    const { body, selectedMemberId, orderId, totalItemPrice } = data;
    if (body.points && selectedMemberId) {
      await reduceMemberPoint(tx, {
        memberId: selectedMemberId,
        points: body.points,
      });

      await insertOrderItemPoint(tx, { orderId, points: body.points });
    }

    if (totalItemPrice >= 10_000 && selectedMemberId) {
      await updateEarnedPoints(tx, {
        memberId: selectedMemberId,
        pointsEarned: Math.ceil(totalItemPrice / 10),
      });
    }
  }

  static async newPosOrder(body: NewPosOrderSchema, userId: string) {
    if (!body.items.length) {
      throw new InternalError(
        "Transaction Failed. There are no items selected"
      );
    }

    const onlyInventoryItems = !body.items.find(
      (item) =>
        item.itemType === "service" ||
        item.itemType === "bundling" ||
        item.itemType === "voucher"
    );

    const newOrderId = await db.transaction(async (tx) => {
      // Step 1: Determine member ID. Creates a new member if requested, otherwise uses existing.
      const selectedMemberId = await Pos._determineMemberId(tx, body);

      const orderStatus = determineOrderStatus(
        onlyInventoryItems,
        body.paymentType
      );

      // Step 2: Create the core order record with customer and status.
      const orderId = (await insertNewOrder(tx, {
        customerName: body.customerName,
        memberId: selectedMemberId ? selectedMemberId : null,
        userId,
        status: orderStatus,
      })) as string;

      // Step 3: Process items to calculate total price before discounts.
      const { totalItemPrice, itemPrices } = await Pos._processOrderItems(tx, {
        items: body.items,
        orderId,
      });

      // Step 4: Apply voucher if present and calculate the discount amount.
      const { voucherDiscountAmount, voucher } = await Pos._handleVouchers(tx, {
        items: body.items,
        orderId,
        selectedMemberId,
        totalItemPrice,
      });

      // Step 5: Redeem and earn member points for the transaction.
      await Pos._handlePoints(tx, {
        body,
        selectedMemberId,
        orderId,
        totalItemPrice,
      });

      // Step 6: Record the final payment after all discounts are applied.
      await insertPaymentQuery(tx, {
        orderId,
        body,
        totalPrice: totalItemPrice,
        voucherDiscountAmount,
        itemPrices,
        voucher,
      });

      // Step 7: Update inventory by reducing stock for items sold.
      await reduceOrderInventoryQty(tx, { items: body.items, orderId, userId });

      return orderId;
    });

    await redis.del(POS_CACHE_KEY);
    await redis.del(INVENTORIES_CACHE_KEY);
    return newOrderId;
  }
}
