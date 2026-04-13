import type { User } from "better-auth/types";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { bundlings } from "@/db/schema/bundlings";
import { deliveries } from "@/db/schema/deliveries";
import { inventories } from "@/db/schema/inventories";
import { members } from "@/db/schema/members";
import { orderItems } from "@/db/schema/order-items";
import { orders, orders as ordersTable } from "@/db/schema/orders";
import {
  type PaymentInsert,
  payments,
  payments as paymentsTable,
} from "@/db/schema/payments";
import { services } from "@/db/schema/services";
import { InternalError, NotFoundError } from "@/exceptions";
import type { ChargeDetails, ItemDetails } from "@/types/midtrans";
import {
  chargeQris,
  insertNewOrder,
  insertOrderItemPoint,
  reduceMemberPoint,
} from "@/utils/orders";
import { Pos } from "../pos/service";
import type { RequestDeliverySchema, RequestPickupSchema } from "./model";

interface RequestDeliveryParam extends RequestDeliverySchema {
  userId: string;
}

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
        itemType: orderItems.itemType,
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
        actions: payments.actions,
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
        status: "pending",
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

  static async createDeliveryRequest({
    userId,
    addressId,
    orderId,
  }: RequestDeliveryParam) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const newDeliveryId = await db.transaction(async (tx) => {
      const [existingDelivery] = await tx
        .select({
          id: deliveries.id,
        })
        .from(deliveries)
        .where(
          and(eq(deliveries.orderId, orderId), eq(deliveries.type, "delivery"))
        )
        .limit(1);

      if (existingDelivery?.id) {
        throw new InternalError(
          "Delivery request already exists for this order"
        );
      }

      const [cancelledOrder] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.status, "cancelled")))
        .limit(1);

      if (cancelledOrder) {
        throw new InternalError(
          "Cannot create delivery request for a cancelled order"
        );
      }

      const [address] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .limit(1);

      if (!address) {
        throw new InternalError("Address not found");
      }

      const [newDelivery] = await tx
        .insert(deliveries)
        .values({
          addressId,
          orderId,
          type: "delivery",
        })
        .returning({ id: deliveries.id });

      if (!newDelivery) {
        throw new InternalError("Failed to create delivery request");
      }

      return newDelivery.id;
    });

    return newDeliveryId;
  }

  static async cancelOrder(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    return await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          id: ordersTable.id,
          status: ordersTable.status,
        })
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      if (order.status !== "pending") {
        throw new InternalError("Only pending orders can be cancelled");
      }

      const [payment] = await tx
        .select({
          id: paymentsTable.id,
          transactionStatus: paymentsTable.transactionStatus,
          actions: paymentsTable.actions,
        })
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId))
        .limit(1);

      if (!payment) {
        throw new NotFoundError("Payment not found");
      }

      if (payment.transactionStatus !== "pending" || payment.actions !== null) {
        throw new InternalError(
          "Order cannot be cancelled after QRIS payment has been created"
        );
      }

      const [pickupDelivery] = await tx
        .select({
          id: deliveries.id,
          type: deliveries.type,
          status: deliveries.status,
        })
        .from(deliveries)
        .where(
          and(
            eq(deliveries.orderId, orderId),
            eq(deliveries.type, "pickup"),
            eq(deliveries.status, "requested")
          )
        )
        .limit(1);

      if (!pickupDelivery) {
        throw new InternalError(
          "Only pickup deliveries with requested status can be cancelled"
        );
      }

      const [cancelledDelivery] = await tx
        .update(deliveries)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(deliveries.id, pickupDelivery.id),
            eq(deliveries.status, "requested")
          )
        )
        .returning({
          id: deliveries.id,
          status: deliveries.status,
        });

      if (!cancelledDelivery) {
        throw new InternalError("Failed to cancel pickup request");
      }

      const [cancelledOrder] = await tx
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(
          and(eq(ordersTable.id, orderId), eq(ordersTable.status, "pending"))
        )
        .returning({
          id: ordersTable.id,
          status: ordersTable.status,
        });

      if (!cancelledOrder) {
        throw new InternalError("Failed to cancel order");
      }

      return {
        ...cancelledOrder,
        delivery: cancelledDelivery,
      };
    });
  }

  static async getOrderPaymentDetails(orderId: string, userId: string) {
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
      .innerJoin(orders, eq(orders.id, paymentsTable.orderId))
      .where(
        and(
          eq(paymentsTable.orderId, orderId.toLowerCase()),
          eq(orders.userId, userId),
          isNotNull(paymentsTable.actions)
        )
      )
      .limit(1);

    if (!row[0]) {
      throw new NotFoundError("Payment details not found");
    }

    return row[0];
  }

  static async chargeQrisPayment(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const item_details: ItemDetails[] = [];

    await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          id: ordersTable.id,
          status: ordersTable.status,
        })
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      if (order.status !== "pending") {
        throw new InternalError("Only pending orders can be charged");
      }

      const [pickupDelivery] = await tx
        .select({
          id: deliveries.id,
          status: deliveries.status,
        })
        .from(deliveries)
        .where(
          and(eq(deliveries.orderId, orderId), eq(deliveries.type, "pickup"))
        )
        .limit(1);

      if (!pickupDelivery) {
        throw new NotFoundError("Pickup delivery not found");
      }

      if (pickupDelivery.status !== "completed") {
        throw new InternalError(
          "QRIS payment can only be charged after pickup is completed"
        );
      }

      const customerOrderItems = await tx
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          subtotal: orderItems.subtotal,
          note: orderItems.note,
          itemType: orderItems.itemType,
          name: sql<string>`
          CASE
            WHEN ${orderItems.itemType} = 'voucher' THEN 'Voucher'
            WHEN ${orderItems.itemType} = 'points' THEN 'Points'
            ELSE COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})
          END
        `,
        })
        .from(orderItems)
        .leftJoin(services, eq(orderItems.serviceId, services.id))
        .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
        .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
        .where(eq(orderItems.orderId, orderId));

      if (!customerOrderItems.length) {
        throw new NotFoundError("Order items not found");
      }

      const [paymentDetail] = await tx
        .select({ total: payments.total })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);

      if (!paymentDetail) {
        throw new NotFoundError("Payment details not found");
      }

      for (const item of customerOrderItems) {
        item_details.push({
          id: item.id,
          quantity: item.quantity,
          price: item.subtotal,
          name: item.name,
        });
      }

      const chargeQrisData: ChargeDetails = {
        payment_type: "qris",
        transaction_details: {
          order_id: orderId,
          gross_amount: paymentDetail.total,
        },
        qris: {
          acquirer: "gopay",
        },
        item_details,
      };

      let paymentDataUpdate: PaymentInsert | undefined;
      const qrisResponse = await chargeQris(chargeQrisData);

      if (qrisResponse.status_code === "201") {
        paymentDataUpdate = {
          orderId,
          amountPaid: paymentDetail.total,
          transactionStatus: "pending",
          total: paymentDetail.total,
          fraudStatus: qrisResponse.fraud_status,
          transactionTime: qrisResponse.transaction_time,
          expiryTime: qrisResponse.expiry_time,
          qrString: qrisResponse.qr_string,
          acquirer: qrisResponse.acquirer,
          actions: qrisResponse.actions,
        };
      } else {
        throw new InternalError("Unsupported payment type");
      }

      if (!paymentDataUpdate) {
        throw new InternalError("Failed to update payment data");
      }

      await tx
        .update(payments)
        .set(paymentDataUpdate)
        .where(eq(payments.orderId, orderId));
    });
  }
}
