import { count, desc, eq, sql } from "drizzle-orm";
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

export abstract class Orders {
  static async getOrders() {
    const orders = await db
      .select({
        id: ordersTable.id,
        customerName: ordersTable.customerName,
        total: paymentsTable.total,
        status: ordersTable.status,
        totalItems: count(orderItems.id),
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .innerJoin(orderItems, eq(ordersTable.id, orderItems.orderId))
      .innerJoin(paymentsTable, eq(ordersTable.id, paymentsTable.orderId))
      .groupBy(
        ordersTable.id,
        ordersTable.customerName,
        paymentsTable.total,
        ordersTable.status,
        ordersTable.createdAt
      )
      .orderBy(desc(ordersTable.createdAt));

    return orders;
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
    const rows = await db
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
      .where(eq(orderItems.orderId, orderId));

    if (!rows.length) {
      throw new NotFoundError("Invalid order id");
    }

    return rows;
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
}
