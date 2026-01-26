import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { bundlingItems } from "@/db/schema/bundling-items";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { orderItems } from "@/db/schema/order-items";
import { type PaymentInsert, payments } from "@/db/schema/payments";
import { InternalError } from "@/exceptions";
import type { NewPosOrderSchema, OrderItem } from "@/modules/pos/model";
import type { TableColumn, Transaction } from "@/utils";

type TableWithPriceAndId = PgTable & {
  id: PgColumn<TableColumn<string>>;
  price: PgColumn<TableColumn<number>>;
};

type OrderItemIdKey = "inventoryId" | "serviceId" | "bundlingId";

export type ItemPrice = {
  id: string;
  price: number;
};

export const getOrderItemIds = (items: OrderItem[], key: OrderItemIdKey) =>
  items.filter((item) => item[key]).map((item) => item[key]) as string[];

export const getPricesQuery = (
  tx: Transaction,
  table: TableWithPriceAndId,
  items: OrderItem[],
  key: OrderItemIdKey
) => {
  const itemIds = getOrderItemIds(items, key);

  if (itemIds.length === 0) {
    return null;
  }

  const priceQuery = tx
    .select({ id: table.id, price: table.price })
    .from(table)
    .where(inArray(table.id, itemIds));

  return priceQuery;
};

export const insertOrderItemsQuery = (
  tx: Transaction,
  orderId: string,
  items: OrderItem[],
  itemPrices: ItemPrice[]
) => {
  const priceMap = new Map(itemPrices.map((p) => [p.id, p.price]));

  const orderItemsData = items.map((item) => {
    const targetId = item.inventoryId || item.serviceId || item.bundlingId;
    const price = targetId ? (priceMap.get(targetId) ?? 0) : 0;

    return {
      ...item,
      orderId,
      subtotal: item.quantity * price,
    };
  });

  return tx
    .insert(orderItems)
    .values(orderItemsData)
    .returning({ id: orderItems.id, subtotal: orderItems.subtotal });
};

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export const insertPaymentQuery = (
  tx: Transaction,
  totalPrice: number,
  orderId: string,
  restBody: DistributiveOmit<NewPosOrderSchema, "customerName" | "items">
) => {
  let paymentData: PaymentInsert;
  const basePaymentData = {
    orderId,
    paymentType: restBody.paymentType,
  };

  if (restBody.paymentType === "cash" && restBody.amountPaid < totalPrice) {
    throw new InternalError("Payment Error");
  }

  if (restBody.paymentType === "cash") {
    paymentData = {
      ...basePaymentData,
      amountPaid: restBody.amountPaid,
      change: restBody.amountPaid - totalPrice,
      total: totalPrice,
      transactionStatus: "settlement",
    };
  } else if (restBody.paymentType === "qris") {
    // You need to handle QRIS logic here to satisfy TypeScript
    paymentData = {
      ...basePaymentData,
      amountPaid: totalPrice, // QRIS is always exact amount
      change: 0,
      total: totalPrice,
      transactionStatus: "pending", // QRIS starts as pending
    };
  } else {
    throw new InternalError("Unsupported payment type");
  }

  return tx.insert(payments).values(paymentData);
};

export const reduceOrderInventoryQty = async (
  tx: Transaction,
  items: OrderItem[]
) => {
  const inventoryQty = new Map<string, number>();
  for (const item of items) {
    if (item.inventoryId) {
      const currentQty = inventoryQty.get(item.inventoryId) ?? 0;
      inventoryQty.set(item.inventoryId, currentQty + item.quantity);
    }
  }

  const bundlingItemQty = await tx
    .select({
      inventoryId: bundlingItems.inventoryId,
      quantity: bundlingItems.quantity,
    })
    .from(bundlingItems)
    .innerJoin(bundlingsTable, eq(bundlingItems.bundlingId, bundlingsTable.id))
    .where(
      and(
        isNotNull(bundlingItems.inventoryId),
        inArray(bundlingsTable.id, getOrderItemIds(items, "bundlingId"))
      )
    );

  for (const item of bundlingItemQty) {
    if (item.inventoryId) {
      const currentQty = inventoryQty.get(item.inventoryId) ?? 0;
      inventoryQty.set(item.inventoryId, currentQty + item.quantity);
    }
  }

  for (const item of inventoryQty.entries()) {
    await tx
      .update(inventoriesTable)
      .set({ stock: sql`${inventoriesTable.stock} - ${item[1]}` })
      .where(eq(inventoriesTable.id, item[0]));
  }
};
