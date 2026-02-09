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
  reduceMemberPoint,
  reduceOrderInventoryQty,
  updateEarnedPoints,
} from "@/utils/orders";
import { INVENTORIES_CACHE_KEY } from "../inventories/service";
import type { NewPosOrderSchema, PosItem } from "./model";

export const POS_CACHE_KEY = "pos:all";

type PosOrderBody = Omit<NewPosOrderSchema, "customerName" | "items">;

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

  private static async _determineMemberId(
    tx: Transaction,
    body: PosOrderBody,
    customerName: string | undefined | null
  ): Promise<string | null> {
    const newMemberId =
      body.newMember && customerName && body.phone && !body.memberId
        ? ((await insertNewMember(tx, {
            name: customerName,
            phone: `+62${body.phone}`,
          })) as string)
        : null;

    return body.newMember ? newMemberId : (body.memberId ?? null);
  }

  private static async _processOrderItems(
    tx: Transaction,
    items: NewPosOrderSchema["items"],
    orderId: string
  ): Promise<{ totalItemPrice: number }> {
    const priceQueries = [
      getPricesQuery(tx, inventoriesTable, items, "inventoryId"),
      getPricesQuery(tx, servicesTable, items, "serviceId"),
      getPricesQuery(tx, bundlingsTable, items, "bundlingId"),
    ].filter((q): q is NonNullable<typeof q> => q !== null);

    const itemPrices = (await Promise.all(priceQueries))
      .flat()
      .filter((price): price is NonNullable<typeof price> => price !== null)
      .filter(
        (item): item is ItemPrice =>
          item !== null && item.id !== null && item.price !== null
      );

    const orderItems = items.filter((item) => !item.voucherId);

    const orderItemsResult = await insertOrderItemsQuery(
      tx,
      orderId,
      orderItems,
      itemPrices
    );

    const totalItemPrice = orderItemsResult.reduce(
      (acc, curr) => curr.subtotal + acc,
      0
    );

    return { totalItemPrice };
  }

  private static async _handleVouchers(
    tx: Transaction,
    items: NewPosOrderSchema["items"],
    orderId: string,
    selectedMemberId: string | null | undefined,
    totalItemPrice: number
  ): Promise<number> {
    const voucherId = items.find((item) => item.voucherId)?.voucherId || "";
    if (!voucherId) {
      return 0;
    }
    const voucher = await getVoucherData(tx, voucherId);
    if (!voucher) {
      return 0;
    }

    const voucherDiscountAmount = getVoucherDiscountAmount(
      voucher,
      totalItemPrice
    );

    if (voucher && orderId && selectedMemberId) {
      await insertOrderVoucher(tx, voucher, voucherDiscountAmount, orderId);
      await insertRedemptionHistory(tx, {
        memberId: selectedMemberId,
        voucherId,
        orderId,
      });
    }

    return voucherDiscountAmount;
  }

  private static async _handlePoints(
    tx: Transaction,
    restBody: PosOrderBody,
    selectedMemberId: string | null | undefined,
    orderId: string,
    totalItemPrice: number
  ): Promise<void> {
    if (restBody.points && selectedMemberId) {
      await reduceMemberPoint(tx, {
        memberId: selectedMemberId,
        points: restBody.points, // this is already negative
      });
      await insertOrderItemPoint(tx, { orderId, points: restBody.points });
    }

    if (totalItemPrice >= 10_000 && selectedMemberId) {
      await updateEarnedPoints(
        tx,
        selectedMemberId,
        Math.ceil(totalItemPrice / 10)
      );
    }
  }

  static async newPosOrder(body: NewPosOrderSchema, userId: string) {
    const { customerName, items, ...restBody } = body;

    if (!items.length) {
      throw new InternalError(
        "Transaction Failed. There are no items selected"
      );
    }

    const onlyInventoryItems = !items.find(
      (item) =>
        item.itemType === "service" ||
        item.itemType === "bundling" ||
        item.itemType === "voucher"
    );

    const newOrderId = await db.transaction(async (tx) => {
      // Step 1: Determine member ID. Creates a new member if requested, otherwise uses existing.
      const selectedMemberId = await Pos._determineMemberId(
        tx,
        restBody,
        customerName
      );

      // Step 2: Create the core order record with customer and status.
      const orderId = (await insertNewOrder(tx, {
        customerName,
        memberId: selectedMemberId ? selectedMemberId : null,
        userId,
        status: onlyInventoryItems ? "completed" : "processing",
      })) as string;

      // Step 3: Process items to calculate total price before discounts.
      const { totalItemPrice } = await Pos._processOrderItems(
        tx,
        items,
        orderId
      );

      // Step 4: Apply voucher if present and calculate the discount amount.
      const voucherDiscountAmount = await Pos._handleVouchers(
        tx,
        items,
        orderId,
        selectedMemberId,
        totalItemPrice
      );

      // Step 5: Redeem and earn member points for the transaction.
      await Pos._handlePoints(
        tx,
        restBody,
        selectedMemberId,
        orderId,
        totalItemPrice
      );

      // Step 6: Record the final payment after all discounts are applied.
      await insertPaymentQuery(
        tx,
        orderId,
        restBody,
        totalItemPrice,
        voucherDiscountAmount
      );

      // Step 7: Update inventory by reducing stock for items sold.
      await reduceOrderInventoryQty(tx, items, orderId, userId);

      return orderId;
    });

    await redis.del(POS_CACHE_KEY);
    await redis.del(INVENTORIES_CACHE_KEY);
    return newOrderId;
  }
}
