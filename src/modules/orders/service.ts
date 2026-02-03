import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
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
import { vouchers } from "@/db/schema/vouchers";
import { NotFoundError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";

export abstract class Orders {
  static async getOrders(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;
    const searchByOrderId = ilike(ordersTable.id, `%${search}%`);
    const searchByName = ilike(ordersTable.customerName, `%${search}%`);
    const searchByPhone = ilike(members.phone, `%${search}%`);

    const whereQuery = or(searchByOrderId, searchByName, searchByPhone);

    const orders = await db
      .select({
        id: ordersTable.id,
        customerName: ordersTable.customerName,
        phone: members.phone,
        total: paymentsTable.total,
        status: ordersTable.status,
        totalItems: count(orderItems.id),
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .innerJoin(orderItems, eq(ordersTable.id, orderItems.orderId))
      .innerJoin(paymentsTable, eq(ordersTable.id, paymentsTable.orderId))
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
        and(eq(orderItems.orderId, orderId), ne(orderItems.itemType, "voucher"))
      );

    const voucherQuery = db
      .select({
        code: vouchers.code,
        description: vouchers.description,
        discountAmount: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(vouchers, eq(orderItems.voucherId, vouchers.id))
      .where(
        and(eq(orderItems.itemType, "voucher"), eq(orderItems.orderId, orderId))
      )
      .limit(1);

    const [orders, [voucher]] = await Promise.all([
      orderItemsQuery,
      voucherQuery,
    ]);

    if (!orders.length) {
      throw new NotFoundError("Order id not found");
    }

    return {
      orders,
      voucher,
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
}
