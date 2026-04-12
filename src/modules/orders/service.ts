import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { bundlings } from "@/db/schema/bundlings";
import { deliveries } from "@/db/schema/deliveries";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders, orders as ordersTable } from "@/db/schema/orders";
import { payments as paymentsTable } from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { vouchers } from "@/db/schema/vouchers";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type { SearchQuery } from "@/search-query";
import { reduceOrderInventoryQty, updateEarnedPoints } from "@/utils/orders";
import { INVENTORIES_CACHE_KEY } from "../inventories/service";
import type { MidtransNotification } from "../midtrans/model";
import { POS_CACHE_KEY } from "../pos/service";

export abstract class Orders {
  static async getOrders(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;
    const searchByOrderId = ilike(ordersTable.id, `%${search}%`);
    const searchByName = ilike(ordersTable.customerName, `%${search}%`);
    const searchByPhone = ilike(members.phone, `%${search}%`);
    const notVoucher = ne(orderItems.itemType, "voucher");

    const filters: SQL[] = [notVoucher];
    const searchLogic = or(searchByOrderId, searchByName, searchByPhone);

    if (searchLogic) {
      filters.push(searchLogic);
    }

    const whereQuery = and(...filters);

    const ordersQuery = db
      .select({
        id: ordersTable.id,
        customerName: ordersTable.customerName,
        phone: members.phone,
        total: paymentsTable.total,
        status: ordersTable.status,
        // count(orderItems.id) is smart: if using leftJoin and there are no items,
        // the ID is null, and count() will correctly return 0 instead of 1.
        totalItems: count(orderItems.id),
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      // 1. CHANGE TO LEFT JOIN: So orders without items don't disappear
      .leftJoin(orderItems, eq(ordersTable.id, orderItems.orderId))
      // 2. CHANGE TO LEFT JOIN: So orders without payments don't disappear
      .leftJoin(paymentsTable, eq(ordersTable.id, paymentsTable.orderId))
      .leftJoin(members, eq(ordersTable.memberId, members.id))
      .groupBy(
        ordersTable.id,
        ordersTable.customerName,
        paymentsTable.total,
        members.phone,
        ordersTable.status,
        ordersTable.createdAt
      )
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      // Bonus tip: Add 'id' to orderBy to prevent pagination from skipping/duplicating
      // rows if multiple orders have the exact same createdAt timestamp.
      .orderBy(desc(ordersTable.createdAt), desc(ordersTable.id));

    const totalQuery = db.select({ count: count() }).from(ordersTable);

    const [orders, [total]] = await Promise.all([ordersQuery, totalQuery]);

    return { orders, total: total?.count ?? 0 };
  }

  static async getOrderStatus(id: string) {
    const orderStatus = (
      await db
        .select({
          status: ordersTable.status,
          createdAt: ordersTable.createdAt,
        })
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .limit(1)
    )[0];

    if (!orderStatus) {
      throw new NotFoundError("Order ID not found");
    }

    return orderStatus;
  }

  static async getOrderItems(orderId: string) {
    const orderItemsQuery = db
      .select({
        id: orderItems.id,
        itemtype: orderItems.itemType,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
        note: orderItems.note,
        name: sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`,
        description: sql<string>`COALESCE(${services.description}, ${inventories.description}, ${bundlings.description})`,
        price: sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`,
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(
        and(
          ilike(orderItems.orderId, orderId),
          ne(orderItems.itemType, "voucher"),
          ne(orderItems.itemType, "points")
        )
      );

    const voucherQuery = db
      .select({
        id: orderItems.id,
        code: vouchers.code,
        description: vouchers.description,
        discountAmount: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(vouchers, eq(orderItems.voucherId, vouchers.id))
      .where(
        and(
          eq(orderItems.itemType, "voucher"),
          ilike(orderItems.orderId, orderId)
        )
      )
      .limit(1);

    const pointsQuery = db
      .select({
        id: orderItems.id,
        points: orderItems.subtotal,
      })
      .from(orderItems)
      .where(
        and(
          ilike(orderItems.orderId, orderId),
          eq(orderItems.itemType, "points")
        )
      )
      .limit(1);

    const [items, [voucher], [points]] = await Promise.all([
      orderItemsQuery,
      voucherQuery,
      pointsQuery,
    ]);

    if (!items.length) {
      throw new NotFoundError("Order id not found");
    }

    return {
      items,
      voucher,
      points,
    };
  }

  static async getOrderPayment(orderId: string) {
    const row = (
      await db
        .select({
          paymentType: paymentsTable.paymentType,
          amountPaid: paymentsTable.amountPaid,
          change: paymentsTable.change,
          transactionStatus: paymentsTable.transactionStatus,
        })
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId))
        .limit(1)
    )[0];

    if (!row) {
      throw new NotFoundError("Invalid order id");
    }

    return row;
  }

  static async getOrdercustomer(orderId: string) {
    const row = (
      await db
        .select({
          name: ordersTable.customerName,
          phone: members.phone,
          memberId: members.id,
        })
        .from(ordersTable)
        .leftJoin(members, eq(members.id, ordersTable.memberId))
        .where(eq(ordersTable.id, orderId))
        .limit(1)
    )[0];

    if (!row) {
      throw new NotFoundError("Invalid order id");
    }

    return row;
  }

  static async getOrderDeliveries(orderId: string) {
    const rows = await db
      .select({
        id: deliveries.id,
        type: deliveries.type,
        status: deliveries.status,
        address: addresses.address,
        label: addresses.label,
        note: deliveries.notes,
      })
      .from(deliveries)
      .leftJoin(addresses, eq(addresses.id, deliveries.addressId))
      .where(eq(deliveries.orderId, orderId));

    return rows;
  }

  static async getOrderPaymentDetails(orderId: string) {
    const row = await db
      .select({
        id: paymentsTable.id,
        orderId: paymentsTable.orderId,
        paymentType: paymentsTable.paymentType,
        discountAmount: paymentsTable.discountAmount,
        amountPaid: paymentsTable.amountPaid,
        change: paymentsTable.change,
        total: paymentsTable.total,
        transactionStatus: paymentsTable.transactionStatus,
        fraudStatus: paymentsTable.fraudStatus,
        qrString: paymentsTable.qrString,
        acquirer: paymentsTable.acquirer,
        actions: paymentsTable.actions,
        transactionTime:
          sql<string>`to_char(${paymentsTable.transactionTime} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SSOF')`.as(
            "transactionTime"
          ),
        expiryTime:
          sql<string>`to_char(${paymentsTable.expiryTime} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SSOF')`.as(
            "expiryTime"
          ),
        createdAt:
          sql<string>`to_char(${paymentsTable.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SSOF')`.as(
            "createdAt"
          ),
        updatedAt:
          sql<string>`to_char(${paymentsTable.updatedAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SSOF')`.as(
            "updatedAt"
          ),
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderId.toLowerCase()))
      .limit(1);

    if (!row[0]) {
      throw new NotFoundError("Payment details not found");
    }

    return row[0];
  }

  static async handleMidtransNotification(body: MidtransNotification) {
    if (body.transaction_status !== "settlement") {
      await db
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(eq(ordersTable.id, body.order_id));
      return {
        updated: false,
        result: null,
        message: "Not a settlement status",
      };
    }

    const orderId = body.order_id.toLowerCase();
    const settlementTime = body.settlement_time;

    const transaction = await db.transaction(async (tx) => {
      const orderItemsQuery = await tx
        .select({ id: orderItems.id, itemType: orderItems.itemType })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const onlyInventory = !orderItemsQuery.some(
        (item) => item.itemType !== "inventory"
      );

      await tx
        .update(ordersTable)
        .set({ status: onlyInventory ? "completed" : "processing" })
        .where(eq(ordersTable.id, orderId));

      // Atomic check + update: only succeeds if still "pending"
      const [paymentResult] = await tx
        .update(paymentsTable)
        .set({
          updatedAt: settlementTime,
          transactionStatus: body.transaction_status,
          amountPaid: Number(body.gross_amount),
        })
        .where(
          and(
            eq(paymentsTable.orderId, orderId),
            eq(paymentsTable.transactionStatus, "pending") // ← atomic guard
          )
        )
        .returning({
          transactionStatus: paymentsTable.transactionStatus,
          updatedAt: paymentsTable.updatedAt,
        });

      return paymentResult ?? null; // null if already settled
    });

    if (!transaction) {
      return { updated: false, result: null, message: "Already processed" };
    }

    return {
      updated: true,
      result: transaction,
      message: "Order status updated to processing",
    };
  }

  static async updateOrderStatus(orderId: string) {
    return await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ status: ordersTable.status })
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundError("Order ID not found");
      }

      const currentStatus = order.status;
      let newStatus: typeof currentStatus;

      if (currentStatus === "processing") {
        newStatus = "ready" as typeof currentStatus;
      } else if (currentStatus === "ready") {
        // check for delivery id based on this order. if it has delivery with type pickup then throw error. dont allow it
        const [delivery] = await tx
          .select({ type: deliveries.type })
          .from(deliveries)
          .where(eq(deliveries.orderId, orderId))
          .limit(1);

        if (delivery && delivery.type === "pickup") {
          throw new InternalError("Cannot complete order with pickup delivery");
        }

        newStatus = "completed" as typeof currentStatus;
      } else {
        throw new InternalError(
          `Cannot update order status from ${currentStatus}`
        );
      }

      await tx
        .update(ordersTable)
        .set({ status: newStatus })
        .where(eq(ordersTable.id, orderId));

      return {
        id: orderId,
        oldStatus: currentStatus,
        newStatus,
      };
    });
  }

  static async reduceQtyAfterPayment(orderId: string) {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!row) {
        throw new InternalError("Failed to find order");
      }

      const { userId } = row;
      const items = await tx
        .select({
          inventoryId: orderItems.inventoryId,
          bundlingId: orderItems.bundlingId,
          serviceId: orderItems.serviceId,
          quantity: orderItems.quantity,
          note: orderItems.note,
          itemType: orderItems.itemType,
        })
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            inArray(orderItems.itemType, ["bundling", "inventory"])
          )
        );

      await reduceOrderInventoryQty(tx, {
        items,
        orderId,
        userId: userId as string,
      });
    });
    await redis.del(POS_CACHE_KEY);
    await redis.del(INVENTORIES_CACHE_KEY);
  }

  static async handlePointsAfterPayment(orderId: string) {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ memberId: orders.memberId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new InternalError("Failed to find order");
      }

      if (!order?.memberId) {
        return;
      }

      const { memberId } = order;

      const orderItemRows = await tx
        .select({
          subtotal: orderItems.subtotal,
          itemType: orderItems.itemType,
        })
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            ne(orderItems.itemType, "voucher")
          )
        );

      const totalItemPrices = orderItemRows
        .filter((item) => item.itemType !== "points")
        .reduce((acc, item) => acc + item.subtotal, 0);

      if (totalItemPrices >= 10_000) {
        await updateEarnedPoints(tx, {
          memberId,
          pointsEarned: Math.ceil(totalItemPrices / 10),
        });
      }
    });
  }
}
