import type { User } from "better-auth/types";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { bundlings } from "@/db/schema/bundlings";
import { deliveries } from "@/db/schema/deliveries";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders as ordersTable } from "@/db/schema/orders";
import {
  type PaymentInsert,
  payments,
  payments as paymentsTable,
} from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { InternalError, NotFoundError } from "@/exceptions";
import type { ItemDetails } from "@/types/midtrans";
import {
  insertNewOrder,
  insertOrderItemPoint,
  reduceMemberPoint,
} from "@/utils/orders";
import { Pos } from "../pos/service";
import type { RequestPickupSchema } from "./model";

export abstract class CustomerOrderService extends Pos {
  private static async verifyOrderOwnership(
    orderId: string,
    userId: string
  ): Promise<void> {
    const memberOrder = await db
      .select({ id: members.id })
      .from(ordersTable)
      .innerJoin(members, eq(ordersTable.memberId, members.id))
      .where(and(eq(ordersTable.id, orderId), eq(members.userId, userId)))
      .limit(1);

    if (!memberOrder[0]) {
      throw new NotFoundError("Order not found");
    }
  }

  static async getCustomerOrders(userId: string, page = 1) {
    const limit = 5;
    const offset = (page - 1) * limit;

    const dataQuery = db
      .select({
        id: ordersTable.id,
        createdAt: ordersTable.createdAt,
        total: paymentsTable.total,
        status: ordersTable.status,
      })
      .from(ordersTable)
      .innerJoin(members, eq(ordersTable.memberId, members.id))
      .leftJoin(paymentsTable, eq(ordersTable.id, paymentsTable.orderId))
      .where(eq(members.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(ordersTable.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(ordersTable)
      .innerJoin(members, eq(ordersTable.memberId, members.id))
      .where(eq(members.userId, userId));

    const [data, totalResult] = await Promise.all([dataQuery, totalQuery]);

    const totalData = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalData / limit);

    return {
      data,
      totalData,
      totalPages,
    };
  }

  static async getOrderDetail(orderId: string, userId: string) {
    const order = await db
      .select({
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .innerJoin(members, eq(ordersTable.memberId, members.id))
      .where(and(eq(ordersTable.id, orderId), eq(members.userId, userId)))
      .limit(1);

    if (!order[0]) {
      throw new NotFoundError("Order not found");
    }

    return order[0];
  }

  static async getOrderItems(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
        note: orderItems.note,
        name: sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`,
        price: sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`,
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(eq(orderItems.orderId, orderId));

    return items;
  }

  static async getOrderPayment(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const payment = await db
      .select({
        status: paymentsTable.transactionStatus,
        method: paymentsTable.paymentType,
        total: paymentsTable.total,
        amountPaid: paymentsTable.amountPaid,
        change: paymentsTable.change,
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderId))
      .limit(1);

    if (!payment[0]) {
      throw new NotFoundError("Payment not found");
    }

    return payment[0];
  }

  static async getOrderDelivery(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const deliveryData = await db
      .select({
        id: deliveries.id,
        type: deliveries.type,
        status: deliveries.status,
        address: addresses.address,
        label: addresses.label,
        notes: deliveries.notes,
      })
      .from(deliveries)
      .leftJoin(addresses, eq(addresses.id, deliveries.addressId))
      .where(eq(deliveries.orderId, orderId));

    return deliveryData;
  }

  static async createPickupRequest(body: RequestPickupSchema, user: User) {
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

    if (onlyInventoryItems) {
      throw new InternalError(
        "Transaction must be at least have 1 service or bundling"
      );
    }

    const newOrderId = await db.transaction(async (tx) => {
      const memberId = (
        await tx
          .select({ id: members.id })
          .from(members)
          .where(eq(members.userId, user.id))
          .limit(1)
      )[0]?.id;

      if (!memberId) {
        throw new InternalError("User is not a member");
      }

      const orderId = await insertNewOrder(tx, {
        customerName: user.name,
        memberId,
        userId: user.id,
        status: "processing",
      });

      if (!orderId) {
        throw new InternalError(
          "Internal Server Error. Failed to create new Order ID"
        );
      }

      const { totalItemPrice, itemPrices } =
        await CustomerOrderService._processOrderItems(tx, {
          items: body.items,
          orderId,
        });

      const { voucherDiscountAmount, voucher } =
        await CustomerOrderService._handleVouchers(tx, {
          items: body.items,
          orderId,
          selectedMemberId: memberId,
          totalItemPrice,
        });

      // handle points
      if (body.points && memberId) {
        await reduceMemberPoint(tx, {
          memberId,
          points: body.points,
        });

        await insertOrderItemPoint(tx, { orderId, points: body.points });
      }

      // handle payment
      const total = totalItemPrice - voucherDiscountAmount - (body.points ?? 0);
      const discountAmount = voucherDiscountAmount + (body.points ?? 0);
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

      const paymentData: PaymentInsert = {
        orderId,
        paymentType: "qris",
        amountPaid: total,
        discountAmount,
        total,
        transactionStatus: "pending",
      };

      await tx.insert(payments).values(paymentData);

      // insert a delivery record
      await tx.insert(deliveries).values({
        addressId: body.addressId,
        orderId,
        type: "pickup",
      });

      return orderId;
    });

    return newOrderId;
  }
}
