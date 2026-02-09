import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { bundlingItems } from "@/db/schema/bundling-items";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { type PaymentInsert, payments } from "@/db/schema/payments";
import { redemptionHistory } from "@/db/schema/redemption-history";
import { stockLogs } from "@/db/schema/stock-logs";
import { vouchers } from "@/db/schema/vouchers";
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

export const getVoucherData = async (tx: Transaction, voucherId: string) => {
  const whereQuery = and(
    eq(vouchers.id, voucherId),
    gt(vouchers.expiresAt, sql`now()`)
  );
  const [voucher] = await tx
    .select({
      id: vouchers.id,
      discountPercentage: vouchers.discountPercentage,
      discountAmount: vouchers.discountAmount,
      minSpend: vouchers.discountPercentage,
      maxDiscountAmount: vouchers.maxDiscountAmount,
    })
    .from(vouchers)
    .where(whereQuery)
    .limit(1);

  if (!voucher) {
    throw new NotFoundError("Voucher not found or expired");
  }

  return voucher;
};

type PosVoucher = Awaited<ReturnType<typeof getVoucherData>>;

export const getVoucherDiscountAmount = (
  voucher: PosVoucher,
  totalAmount: number
) => {
  const voucherType =
    voucher.discountPercentage && voucher.discountPercentage !== null
      ? "percentage"
      : "fixed";

  const percentageDiscount =
    voucherType === "percentage" &&
    voucher.discountPercentage &&
    Number(voucher.discountPercentage) > 0
      ? Number(voucher.discountPercentage)
      : 0;

  const fixedDiscount =
    voucherType === "fixed" &&
    voucher.discountAmount &&
    voucher.discountAmount > 0
      ? voucher.discountAmount
      : 0;

  const totalPercentageDiscount =
    totalAmount - Math.floor(totalAmount * (percentageDiscount / 100));

  const maxDiscountAmount = {
    percentage:
      totalPercentageDiscount >= voucher.maxDiscountAmount
        ? voucher.maxDiscountAmount
        : totalPercentageDiscount,
    fixed:
      fixedDiscount > voucher.maxDiscountAmount
        ? voucher.maxDiscountAmount
        : fixedDiscount,
  };

  return maxDiscountAmount[voucherType];
};

export const insertOrderVoucher = async (
  tx: Transaction,
  voucher: PosVoucher,
  discountAmount: number,
  orderId: string
) => {
  await tx.insert(orderItems).values({
    orderId,
    voucherId: voucher.id,
    itemType: "voucher",
    quantity: 1,
    subtotal: -1 * discountAmount,
  });
};

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export const insertPaymentQuery = (
  tx: Transaction,
  orderId: string,
  restBody: DistributiveOmit<NewPosOrderSchema, "customerName" | "items">,
  totalPrice: number,
  totalDiscount = 0
) => {
  let paymentData: PaymentInsert;
  const basePaymentData = {
    orderId,
    paymentType: restBody.paymentType,
  };

  if (
    restBody.paymentType === "cash" &&
    restBody.amountPaid < totalPrice - totalDiscount + (restBody.points ?? 0)
  ) {
    throw new InternalError("Payment Error");
  }

  if (restBody.paymentType === "cash") {
    paymentData = {
      ...basePaymentData,
      amountPaid: restBody.amountPaid,
      change:
        restBody.amountPaid -
        totalPrice +
        totalDiscount -
        (restBody.points ?? 0),
      discountAmount: totalDiscount - (restBody.points ?? 0),
      total: totalPrice - totalDiscount + (restBody.points ?? 0),
      transactionStatus: "settlement",
    };
  } else if (restBody.paymentType === "qris") {
    // You need to handle QRIS logic here to satisfy TypeScript
    paymentData = {
      ...basePaymentData,
      amountPaid: totalPrice, // QRIS is always exact amount
      change: 0,
      discountAmount: totalDiscount - (restBody.points ?? 0),
      total: totalPrice - totalDiscount - (restBody.points ?? 0),
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

export const updateEarnedPoints = async (
  tx: Transaction,
  memberId: string,
  pointsEarned: number
) => {
  await tx
    .update(members)
    .set({ points: sql`${members.points} + ${pointsEarned}` })
    .where(eq(members.id, memberId));
};

interface InsertRedemption {
  memberId: string;
  voucherId: string;
  orderId: string;
}

export const insertRedemptionHistory = async (
  tx: Transaction,
  values: InsertRedemption
) => {
  await tx.insert(redemptionHistory).values(values);
};

interface ReduceMemberPoint {
  points: number;
  memberId: string;
}

export const reduceMemberPoint = async (
  tx: Transaction,
  values: ReduceMemberPoint
) => {
  const [member] = await tx
    .select({ points: members.points })
    .from(members)
    .where(eq(members.id, values.memberId));

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.points + values.points < 0) {
    throw new InternalError("Insufficient points");
  }

  await tx
    .update(members)
    .set({
      points: sql`${members.points} + ${values.points}`,
    })
    .where(eq(members.id, values.memberId));
};

interface OrderItemPoint {
  orderId: string;
  points: number;
}

export const insertOrderItemPoint = async (
  tx: Transaction,
  values: OrderItemPoint
) => {
  await tx.insert(orderItems).values({
    orderId: values.orderId,
    itemType: "points",
    subtotal: values.points,
    quantity: 1,
  });
};

export const insertNewMember = async (
  tx: Transaction,
  data: { name: string; phone: string }
) => {
  const [member] = await tx
    .insert(members)
    .values(data)
    .returning({ id: members.id });

  return member?.id;
};

type OrderStatus = typeof orders.$inferSelect.status;

export const insertNewOrder = async (
  tx: Transaction,
  data: {
    customerName: string;
    memberId?: string | null;
    userId: string;
    status: OrderStatus;
  }
) => {
  const [newOrder] = await tx
    .insert(orders)
    .values(data)
    .returning({ id: orders.id });

  return newOrder?.id;
};
