import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import midtransClient from "midtrans-client";
import { adjustmentLogs } from "@/db/schema/adjustment-logs";
import { bundlingItems } from "@/db/schema/bundling-items";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { type PaymentInsert, payments } from "@/db/schema/payments";
import { redemptionHistory } from "@/db/schema/redemption-history";
import { vouchers } from "@/db/schema/vouchers";
import { InternalError, NotFoundError } from "@/exceptions";
import type { NewPosOrderSchema, OrderItem } from "@/modules/pos/model";
import type {
  ChargeDetails,
  ItemDetails,
  QrisTransactionResponse,
} from "@/types/midtrans";
import type { PaymentType, TableColumn, Transaction } from "@/utils";

type TableWithPriceAndId = PgTable & {
  id: PgColumn<TableColumn<string>>;
  name: PgColumn<TableColumn<string>>;
  price: PgColumn<TableColumn<number>>;
};

type OrderItemIdKey = "inventoryId" | "serviceId" | "bundlingId";

export type ItemPrice = {
  id: string;
  name: string;
  price: number;
};

export const getOrderItemIds = (items: OrderItem[], key: OrderItemIdKey) =>
  items.filter((item) => item[key]).map((item) => item[key]) as string[];

export const getPricesQuery = (
  tx: Transaction,
  data: {
    table: TableWithPriceAndId;
    items: OrderItem[];
    key: OrderItemIdKey;
  }
) => {
  const { table, items, key } = data;
  const itemIds = getOrderItemIds(items, key);

  if (itemIds.length === 0) {
    return null;
  }

  const priceQuery = tx
    .select({ id: table.id, name: table.name, price: table.price })
    .from(table)
    .where(inArray(table.id, itemIds));

  return priceQuery;
};

export const insertOrderItemsQuery = (
  tx: Transaction,
  data: {
    orderId: string;
    items: OrderItem[];
    itemPrices: ItemPrice[];
  }
) => {
  const { orderId, items, itemPrices } = data;
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

export type PosVoucher = Awaited<ReturnType<typeof getVoucherData>>;

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
  data: {
    voucher: PosVoucher;
    discountAmount: number;
    orderId: string;
  }
) => {
  const { voucher, discountAmount, orderId } = data;
  await tx.insert(orderItems).values({
    orderId,
    voucherId: voucher.id,
    itemType: "voucher",
    quantity: 1,
    subtotal: -1 * discountAmount,
  });
};

// type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
//   ? Omit<T, K>
//   : never;

const chargeQris = async (
  data: ChargeDetails
): Promise<QrisTransactionResponse> => {
  const core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY as string,
    clientKey: process.env.MIDTRANS_CLIENT_KEY as string,
  });

  const response = await core.charge(JSON.stringify(data));
  return response;
};

export const insertPaymentQuery = async (
  tx: Transaction,
  data: {
    orderId: string;
    body: NewPosOrderSchema;
    totalPrice: number;
    voucherDiscountAmount: number;
    itemPrices: ItemPrice[];
    voucher?: PosVoucher | undefined;
  }
) => {
  const {
    orderId,
    body,
    totalPrice,
    voucherDiscountAmount = 0,
    itemPrices,
    voucher,
  } = data;
  let paymentData: PaymentInsert | undefined;
  const basePaymentData = {
    orderId,
    paymentType: body.paymentType,
  };

  if (
    body.paymentType === "cash" &&
    body.amountPaid < totalPrice - voucherDiscountAmount - (body.points ?? 0)
  ) {
    throw new InternalError("Payment Error");
  }

  const total = totalPrice - voucherDiscountAmount - (body.points ?? 0);
  const discountAmount = voucherDiscountAmount + (body.points ?? 0);

  if (body.paymentType === "cash") {
    paymentData = {
      ...basePaymentData,
      amountPaid: body.amountPaid,
      change:
        body.amountPaid -
        totalPrice +
        voucherDiscountAmount -
        (body.points ?? 0),
      discountAmount,
      total,
      transactionStatus: "settlement",
    };
  } else if (body.paymentType === "qris") {
    // You need to handle QRIS logic here to satisfy TypeScript

    // todos: get item details from itemPrices and its quantities from restbody
    const item_details: ItemDetails[] = [];
    const orderItems = body.items.filter(
      (item) => !(item.itemType === "voucher" || item.itemType === "points")
    );

    orderItems.map((item) =>
      item_details.push({
        id: String(item.bundlingId || item.serviceId || item.inventoryId),
        quantity: item.quantity,
        name:
          itemPrices.find(
            (price) =>
              price.id === item.bundlingId ||
              price.id === item.serviceId ||
              price.id === item.inventoryId
          )?.name || "",
        price:
          itemPrices.find(
            (price) =>
              price.id === item.bundlingId ||
              price.id === item.serviceId ||
              price.id === item.inventoryId
          )?.price || 0,
      })
    );

    if (body.points) {
      item_details.push({
        price: -1 * body.points,
        quantity: 1,
        name: "Points",
      });
    }

    if (voucher) {
      item_details.push({
        price: -1 * voucherDiscountAmount,
        quantity: 1,
        name: "Voucher",
      });
    }

    const chargeQrisData: ChargeDetails = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
      qris: {
        acquirer: "gopay",
      },
      item_details,
    };

    const qrisResponse = await chargeQris(chargeQrisData);

    if (qrisResponse.status_code === "201") {
      paymentData = {
        ...basePaymentData,
        amountPaid: total,
        discountAmount,
        total,
        transactionStatus: "pending", // QRIS starts as pending
        transactionTime: qrisResponse.transaction_time,
        fraudStatus: qrisResponse.fraud_status,
        expiryTime: qrisResponse.expiry_time,
        qrString: qrisResponse.qr_string,
        acquirer: qrisResponse.acquirer,
        actions: qrisResponse.actions,
      };
    }
  } else {
    throw new InternalError("Unsupported payment type");
  }

  if (!paymentData) {
    throw new InternalError("Failed to create payment data");
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
  data: {
    items: OrderItem[];
    orderId: string;
    userId: string;
  }
) => {
  const { items, orderId, userId } = data;
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

      await tx.insert(adjustmentLogs).values({
        actorId: userId,
        inventoryId: stockLog.inventoryId,
        stockRemaining: updatedInventory.stock,
        changeAmount: -1 * stockLog.quantity,
        bundlingId: stockLog.bundlingId || null,
        adjustmentTime: new Date(),
        orderId,
      });
    })
  );
};

export const updateEarnedPoints = async (
  tx: Transaction,
  data: {
    memberId: string;
    pointsEarned: number;
  }
) => {
  const { memberId, pointsEarned } = data;
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
    .where(eq(members.id, values.memberId))
    .limit(1);

  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.points - values.points < 0) {
    throw new InternalError("Insufficient points");
  }

  await tx
    .update(members)
    .set({
      points: sql`${members.points} - ${values.points}`,
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
    subtotal: -1 * values.points,
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

export type OrderStatus = typeof orders.$inferSelect.status;

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

export const determineOrderStatus = (
  onlyInventoryItems: boolean,
  paymentType: PaymentType
): Exclude<OrderStatus, "ready"> => {
  if (!paymentType) {
    throw new InternalError("Payment type is required");
  }

  if (onlyInventoryItems && paymentType === "cash") {
    return "completed";
  }

  if (!onlyInventoryItems && paymentType === "cash") {
    return "processing";
  }

  return "pending";
};
