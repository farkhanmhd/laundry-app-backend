import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { bundlingItems } from "@/db/schema/bundling-items";
import { inventories } from "@/db/schema/inventories";
import { orderItems } from "@/db/schema/order-items";
import { type PaymentInsert, payments } from "@/db/schema/payments";
import { stockLogs } from "@/db/schema/stock-logs";
import { InternalError, NotFoundError } from "@/exceptions";
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

type StockLogInsert = {
  inventoryId: string;
  quantity: number;
  bundlingId: string | null;
};

export const reduceOrderInventoryQty = async (
  tx: Transaction,
  items: OrderItem[],
  orderId: string,
  userId: string
) => {
  const stockLogData: StockLogInsert[] = [];
  for (const item of items) {
    if (item.inventoryId) {
      // stock log data for inventory only
      stockLogData.push({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        bundlingId: null,
      });
    }
  }

  const bundlingIds = getOrderItemIds(items, "bundlingId");

  if (bundlingIds.length > 0) {
    // fetching quantity used on a bundle with inventory
    const bundlingInvQty = await tx
      .select({
        inventoryId: bundlingItems.inventoryId,
        qtyPerBundle: bundlingItems.quantity,
        bundlingId: bundlingItems.bundlingId,
      })
      .from(bundlingItems)
      .where(
        and(
          isNotNull(bundlingItems.inventoryId),
          inArray(bundlingItems.bundlingId, bundlingIds)
        )
      );

    for (const bundlingInv of bundlingInvQty) {
      const orderItem = items.find(
        (item) => item.bundlingId === bundlingInv.bundlingId
      );

      if (orderItem && bundlingInv.inventoryId && bundlingInv.bundlingId) {
        stockLogData.push({
          inventoryId: bundlingInv.inventoryId,
          quantity: bundlingInv.qtyPerBundle * orderItem.quantity,
          bundlingId: bundlingInv.bundlingId,
        });
      }
    }
  }

  stockLogData.sort((a, b) => a.inventoryId.localeCompare(b.inventoryId));

  await Promise.all(
    stockLogData.map(async (stockLog) => {
      const [updatedInventory] = await tx
        .update(inventories)
        .set({
          stock: sql`${inventories.stock} - ${stockLog.quantity}`,
        })
        .where(eq(inventories.id, stockLog.inventoryId))
        .returning({
          stock: inventories.stock,
        });

      if (!updatedInventory) {
        throw new NotFoundError("Inventory Id not found");
      }

      await tx.insert(stockLogs).values({
        type: "order",
        actorId: userId,
        inventoryId: stockLog.inventoryId,
        stockRemaining: updatedInventory.stock,
        changeAmount: -1 * stockLog.quantity,
        bundlingId: stockLog.bundlingId || null,
        orderId,
      });
    })
  );
};
