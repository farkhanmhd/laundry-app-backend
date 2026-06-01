import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { bundlings } from "@/db/schema/bundlings";
import { deliveries } from "@/db/schema/deliveries";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { vouchers } from "@/db/schema/vouchers";
import { NotFoundError } from "@/exceptions";

export class ReceiptService {
  static async lookup(orderId: string) {
    const result = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        createdAt: orders.createdAt,
        status: orders.status,
        memberName: members.name,
      })
      .from(orders)
      .leftJoin(members, eq(orders.memberId, members.id))
      .where(eq(orders.id, orderId.toLowerCase()))
      .limit(1);

    const order = result[0];

    if (!order) {
      return {
        orderId,
        exists: false,
        customerName: null,
        createdAt: null,
        status: null,
      };
    }

    return {
      orderId: order.id,
      exists: true,
      customerName: order.customerName || order.memberName || null,
      createdAt: order.createdAt,
      status: order.status,
    };
  }

  static async getInfo(id: string) {
    const result = await db
      .select({
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    const order = result[0];

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return {
      status: order.status,
      createdAt: order.createdAt,
    };
  }

  static async getCustomer(id: string) {
    const result = await db
      .select({
        customerName: orders.customerName,
        memberName: members.name,
        phone: members.phone,
        memberId: orders.memberId,
      })
      .from(orders)
      .leftJoin(members, eq(orders.memberId, members.id))
      .where(eq(orders.id, id))
      .limit(1);

    const order = result[0];

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return {
      name: order.customerName || order.memberName || "Guest",
      phone: order.phone || "-",
      memberId: order.memberId,
    };
  }

  static async getDeliveries(id: string) {
    const orderDeliveries = await db
      .select({
        id: deliveries.id,
        type: deliveries.type,
        address: addresses.address,
        status: deliveries.status,
      })
      .from(deliveries)
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(deliveries.orderId, id));

    return orderDeliveries;
  }

  static async getPayment(id: string) {
    const result = await db
      .select({
        paymentType: payments.paymentType,
        amountPaid: payments.amountPaid,
        change: payments.change,
        transactionStatus: payments.transactionStatus,
      })
      .from(payments)
      .where(eq(payments.orderId, id))
      .limit(1);

    const payment = result[0];

    if (!payment) {
      return {
        paymentType: "N/A",
        amountPaid: 0,
        change: 0,
        transactionStatus: "pending",
      };
    }

    return {
      paymentType: payment.paymentType || "N/A",
      amountPaid: payment.amountPaid,
      change: payment.change || 0,
      transactionStatus: payment.transactionStatus,
    };
  }

  static async getItems(id: string) {
    const result = await db
      .select({
        id: orderItems.id,
        itemType: orderItems.itemType,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
        serviceName: services.name,
        inventoryName: inventories.name,
        bundlingName: bundlings.name,
        voucherId: vouchers.id,
        voucherCode: vouchers.code,
        voucherDescription: vouchers.description,
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .leftJoin(vouchers, eq(orderItems.voucherId, vouchers.id))
      .where(eq(orderItems.orderId, id));

    const formattedItems = result
      .filter((i) => {
        return ["service", "inventory", "bundling"].includes(i.itemType);
      })
      .map((i) => {
        return {
          id: i.id,
          name: i.serviceName || i.inventoryName || i.bundlingName || "Unknown",
          qty: i.quantity,
          price: i.quantity > 0 ? i.subtotal / i.quantity : 0,
          subtotal: i.subtotal,
        };
      });

    const voucherItem = result.find((i) => {
      return i.itemType === "voucher";
    });
    const pointsItem = result.find((i) => {
      return i.itemType === "points";
    });

    return {
      items: formattedItems,
      voucher: voucherItem?.voucherId
        ? {
            id: voucherItem.voucherId,
            code: voucherItem.voucherCode || "",
            description: voucherItem.voucherDescription || "",
            discountAmount: voucherItem.subtotal,
          }
        : null,
      points: pointsItem
        ? {
            id: pointsItem.id,
            points: pointsItem.quantity,
          }
        : null,
    };
  }
}
