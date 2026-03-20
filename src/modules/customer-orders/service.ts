import { sleep } from "bun";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { bundlings } from "@/db/schema/bundlings";
import { deliveries } from "@/db/schema/deliveries";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders as ordersTable } from "@/db/schema/orders";
import { payments as paymentsTable } from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { NotFoundError } from "@/exceptions";
import type { RequestPickupSchema } from "./model";

export abstract class CustomerOrderService {
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

  static async createPickupRequest(body: RequestPickupSchema, userId: string) {
    await sleep(3000);
    const newOrderId = "test";
    return newOrderId;
  }
}
