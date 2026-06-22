import { and, eq, gt, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bundlingItems } from "@/db/schema/bundling-items";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { members as membersTable } from "@/db/schema/members";
import { services as servicesTable } from "@/db/schema/services";
import { vouchers } from "@/db/schema/vouchers";
import { InternalError, NotFoundError } from "@/exceptions";
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
import type { NewPosOrderSchema } from "./model";

export abstract class Pos {
  static async getPosItems() {
    try {
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
        .from(inventoriesTable)
        .where(isNull(inventoriesTable.deletedAt));

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
        .from(servicesTable)
        .where(isNull(servicesTable.deletedAt));

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
        .from(bundlingsTable)
        .where(isNull(bundlingsTable.deletedAt));

      const rows = await unionAll(inventories, services, bundlings);

      const bundlingItemsMap =
        await Pos.getBundlingItemsMap(rows);

      return rows.map((item) => {
        if (item.itemType === "bundling") {
          return {
            ...item,
            items: bundlingItemsMap.get(item.id) ?? [],
          };
        }
        return item;
      });
    } catch (error) {
      console.error("Error fetching POS items:", error);
      throw new InternalError("Could not retrieve POS items.");
    }
  }

  protected static async getBundlingItemsMap(
    items: Array<{ id: string; itemType: string }>
  ) {
    const bundlingIds = items
      .filter((item) => item.itemType === "bundling")
      .map((item) => item.id);

    const bundlingItemsMap = new Map<
      string,
      Array<{
        id: string;
        quantity: number;
        name: string;
      }>
    >();

    if (bundlingIds.length > 0) {
      const bundlingItemRows = await db
        .select({
          bundlingId: bundlingItems.bundlingId,
          itemId: sql<string>`COALESCE(${bundlingItems.id}, ${servicesTable.id}, ${inventoriesTable.id})`,
          quantity: bundlingItems.quantity,
          name: sql<string>`COALESCE(${servicesTable.name}, ${inventoriesTable.name})`,
        })
        .from(bundlingItems)
        .leftJoin(servicesTable, eq(bundlingItems.serviceId, servicesTable.id))
        .leftJoin(inventoriesTable, eq(bundlingItems.inventoryId, inventoriesTable.id))
        .where(inArray(bundlingItems.bundlingId, bundlingIds));

      for (const bi of bundlingItemRows) {
        const existing = bundlingItemsMap.get(bi.bundlingId);
        if (existing) {
          existing.push({
            id: bi.itemId,
            quantity: bi.quantity,
            name: bi.name,
          });
        } else {
          bundlingItemsMap.set(bi.bundlingId, [
            {
              id: bi.itemId,
              quantity: bi.quantity,
              name: bi.name,
            },
          ]);
        }
      }
    }

    return bundlingItemsMap;
  }

  static async getPosMembers(query: SearchQuery) {
    try {
      const { search } = query;

      if (!search) {
        return [];
      }

      const searchByName = ilike(membersTable.name, `%${search}%`);
      const searchByPhone = ilike(membersTable.phone, `%${search}%`);

      const whereQuery = or(searchByName, searchByPhone);

      const members = await db
        .select({
          id: membersTable.id,
          name: membersTable.name,
          phone: sql<string>`${membersTable.phone}`,
          points: membersTable.points,
        })
        .from(membersTable)
        .where(whereQuery)
        .orderBy(membersTable.name)
        .limit(5);

      return members;
    } catch (error) {
      console.error("Error searching POS members:", error);
      throw new InternalError("Could not search members.");
    }
  }

  static async getPosVouchers() {
    try {
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
    } catch (error) {
      console.error("Error fetching POS vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  static async getVoucherByCode(voucherCode: string) {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error fetching voucher by code:", error);
      throw new InternalError("Could not retrieve voucher.");
    }
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

    try {
      const onlyInventoryItems = !body.items.find(
        (item) =>
          item.itemType === "service" ||
          item.itemType === "bundling" ||
          item.itemType === "voucher"
      );

      const newOrderId = await db.transaction(async (tx) => {
        const selectedMemberId = await Pos._determineMemberId(tx, body);

        const orderStatus = determineOrderStatus(
          onlyInventoryItems,
          body.paymentType
        );

        const orderId = (await insertNewOrder(tx, {
          customerName: body.customerName,
          memberId: selectedMemberId ? selectedMemberId : null,
          userId,
          status: orderStatus,
        })) as string;

        const { totalItemPrice, itemPrices } = await Pos._processOrderItems(
          tx,
          {
            items: body.items,
            orderId,
          }
        );

        const { voucherDiscountAmount, voucher } = await Pos._handleVouchers(
          tx,
          {
            items: body.items,
            orderId,
            selectedMemberId,
            totalItemPrice,
          }
        );

        if (body.paymentType === "cash") {
          await Pos._handlePoints(tx, {
            body,
            selectedMemberId,
            orderId,
            totalItemPrice,
          });
        }

        await insertPaymentQuery(tx, {
          orderId,
          body,
          totalPrice: totalItemPrice,
          voucherDiscountAmount,
          itemPrices,
          voucher,
        });

        if (body.paymentType === "cash") {
          await reduceOrderInventoryQty(tx, {
            items: body.items,
            orderId,
            userId,
          });
        }

        return orderId;
      });

      return newOrderId;
    } catch (error) {
      if (error instanceof InternalError) {
        throw error;
      }
      console.error("Error creating POS order:", error);
      throw new InternalError("Failed to create POS order.");
    }
  }
}
