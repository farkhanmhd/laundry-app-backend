import type { User } from "better-auth/types";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { user } from "@/db/schema/auth";
import { bundlingItems } from "@/db/schema/bundling-items";
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
import { routes } from "@/db/schema/routes";
import { services } from "@/db/schema/services";
import { vehicles } from "@/db/schema/vehicles";
import { weightRanges } from "@/db/schema/weight-ranges";
import { InternalError, NotFoundError } from "@/exceptions";
import type {
  ChargeDetails,
  ItemDetails,
  QrisTransactionResponse,
} from "@/types/midtrans";
import type { Transaction } from "@/utils";
import {
  chargeQris,
  insertNewOrder,
  insertOrderItemPoint,
  reduceMemberPoint,
} from "@/utils/orders";
import { Pos } from "../pos/service";
import type {
  PickupItem,
  RequestDeliverySchema,
  RequestPickupSchema,
  UpdateOrderItemsBody,
} from "./model";

interface RequestDeliveryParam extends RequestDeliverySchema {
  userId: string;
}

interface ItemWithMeta extends PickupItem {
  itemType: "service" | "inventory" | "bundling";
  maxWeight: number | null;
}

interface ResolvedItem {
  voucherId?: string;
  note?: string;
  serviceId?: string;
  inventoryId?: string;
  bundlingId?: string;
  quantity: number;
  itemType: "service" | "inventory" | "bundling" | "voucher" | "points";
}

interface CustomerOrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  name: string;
}

interface ItemRow {
  id: string;
  maxWeight: number | null;
  isCustomerOrderable: boolean | null;
}

export abstract class CustomerOrderService extends Pos {
  static async getPosItems() {
    try {
      const inventoryRows = db
        .select({
          id: inventories.id,
          name: inventories.name,
          description: inventories.description,
          price: inventories.price,
          image: inventories.image,
          stock: sql<number | null>`${inventories.stock}`.as("stock"),
          itemType: sql<string>`'inventory'`.as("item_type"),
          isCustomerOrderable: inventories.isCustomerOrderable,
          maxWeight: inventories.maxWeight,
        })
        .from(inventories)
        .where(
          and(
            isNull(inventories.deletedAt),
            eq(inventories.isCustomerOrderable, true)
          )
        );

      const serviceRows = db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          price: services.price,
          image: services.image,
          stock: sql<number | null>`null`.as("stock"),
          itemType: sql<string>`'service'`.as("item_type"),
          isCustomerOrderable: services.isCustomerOrderable,
          maxWeight: services.maxWeight,
        })
        .from(services)
        .where(
          and(
            isNull(services.deletedAt),
            eq(services.isCustomerOrderable, true)
          )
        );

      const bundlingRows = db
        .select({
          id: bundlings.id,
          name: bundlings.name,
          description: bundlings.description,
          price: bundlings.price,
          image: bundlings.image,
          stock: sql<number | null>`null`.as("stock"),
          itemType: sql<string>`'bundling'`.as("item_type"),
          isCustomerOrderable: bundlings.isCustomerOrderable,
          maxWeight: bundlings.maxWeight,
        })
        .from(bundlings)
        .where(
          and(
            isNull(bundlings.deletedAt),
            eq(bundlings.isCustomerOrderable, true)
          )
        );

      const rows = await unionAll(inventoryRows, serviceRows, bundlingRows);

      const bundlingItemsMap = await Pos.getBundlingItemsMap(rows);

      return rows.map((item) => {
        if (item.itemType === "bundling") {
          return {
            ...item,
            items: bundlingItemsMap.get(item.id) ?? [],
          };
        }
        return item;
      });
    } catch (error) {
      console.error("Error fetching POS items:", error);
      throw new InternalError("Could not retrieve POS items.");
    }
  }

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
    try {
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
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw new InternalError("Could not retrieve customer orders.");
    }
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
        bundlingId: orderItems.bundlingId,
        name: sql<string>`COALESCE(${services.name}, ${inventories.name}, ${bundlings.name})`,
        price: sql<number>`COALESCE(${services.price}, ${inventories.price}, ${bundlings.price})`,
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .leftJoin(inventories, eq(orderItems.inventoryId, inventories.id))
      .leftJoin(bundlings, eq(orderItems.bundlingId, bundlings.id))
      .where(eq(orderItems.orderId, orderId));

    const bundlingItemsMap =
      await CustomerOrderService.getOrderBundlingItemsMap(items);

    const mappedItems = items.map((item) => {
      const { bundlingId: _bundlingId, ...rest } = item;
      if (item.itemType === "bundling" && item.bundlingId) {
        return {
          ...rest,
          items: bundlingItemsMap.get(item.bundlingId) ?? [],
        };
      }
      return rest;
    });

    return mappedItems;
  }

  private static async getOrderBundlingItemsMap(
    items: Array<{ bundlingId: string | null; itemType: string }>
  ) {
    const bundlingIds = items
      .filter(
        (item): item is typeof item & { bundlingId: string } =>
          item.itemType === "bundling" && item.bundlingId !== null
      )
      .map((item) => item.bundlingId);

    const bundlingItemsMap = new Map<
      string,
      Array<{
        id: string;
        quantity: number;
        name: string;
      }>
    >();

    if (bundlingIds.length > 0) {
      const bundlingItemRows = await db
        .select({
          bundlingId: bundlingItems.bundlingId,
          itemId: sql<string>`COALESCE(${bundlingItems.id}, ${services.id}, ${inventories.id})`,
          quantity: bundlingItems.quantity,
          name: sql<string>`COALESCE(${services.name}, ${inventories.name})`,
        })
        .from(bundlingItems)
        .leftJoin(services, eq(bundlingItems.serviceId, services.id))
        .leftJoin(inventories, eq(bundlingItems.inventoryId, inventories.id))
        .where(inArray(bundlingItems.bundlingId, bundlingIds));

      for (const bi of bundlingItemRows) {
        const existing = bundlingItemsMap.get(bi.bundlingId);
        if (existing) {
          existing.push({
            id: bi.itemId,
            quantity: bi.quantity,
            name: bi.name,
          });
        } else {
          bundlingItemsMap.set(bi.bundlingId, [
            {
              id: bi.itemId,
              quantity: bi.quantity,
              name: bi.name,
            },
          ]);
        }
      }
    }

    return bundlingItemsMap;
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
        driverName: user.name,
        vehicleName: vehicles.name,
        licensePlate: vehicles.licensePlate,
      })
      .from(deliveries)
      .leftJoin(addresses, eq(addresses.id, deliveries.addressId))
      .leftJoin(routes, eq(deliveries.routeId, routes.id))
      .leftJoin(user, eq(routes.userId, user.id))
      .leftJoin(vehicles, eq(routes.vehicleId, vehicles.id))
      .where(eq(deliveries.orderId, orderId));

    return deliveryData;
  }

  static async createPickupRequest(body: RequestPickupSchema, user: User) {
    if (!body.items.length) {
      throw new InternalError(
        "Transaction Failed. There are no items selected"
      );
    }

    const weightRange = await CustomerOrderService.validateWeightRange(
      body.weightRangeId
    );

    CustomerOrderService.validateCustomWeight(body.weight, weightRange);

    const effectiveWeight = Number(weightRange.maxWeight);

    CustomerOrderService.validateHasServiceOrBundling(body.items);

    const itemsWithMeta = await CustomerOrderService.enrichItemsWithMeta(
      body.items
    );

    const resolvedItems = CustomerOrderService.resolveItemQuantities(
      itemsWithMeta,
      effectiveWeight
    );

    try {
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

        const orderWeight =
          body.weight !== undefined && body.weight !== null
            ? String(body.weight)
            : null;

        await tx
          .update(ordersTable)
          .set({
            weightRangeId: body.weightRangeId,
            weight: orderWeight,
          })
          .where(eq(ordersTable.id, orderId));

        const { totalItemPrice, itemPrices } =
          await CustomerOrderService._processOrderItems(tx, {
            items: resolvedItems,
            orderId,
          });

        const { voucherDiscountAmount } =
          await CustomerOrderService._handleVouchers(tx, {
            items: body.items,
            orderId,
            selectedMemberId: memberId,
            totalItemPrice,
          });

        if (body.points && memberId) {
          await reduceMemberPoint(tx, {
            memberId,
            points: body.points,
          });

          await insertOrderItemPoint(tx, { orderId, points: body.points });
        }

        const total =
          totalItemPrice - voucherDiscountAmount - (body.points ?? 0);
        const discountAmount = voucherDiscountAmount + (body.points ?? 0);
        const itemDetails = CustomerOrderService.buildItemDetails(
          resolvedItems,
          itemPrices
        );

        if (body.points) {
          itemDetails.push({
            price: -1 * body.points,
            quantity: 1,
            name: "Points",
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

        await tx.insert(deliveries).values({
          addressId: body.addressId,
          orderId,
          type: "pickup",
          requestTime: body.requestTime,
        });

        return orderId;
      });

      return newOrderId;
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error creating pickup request:", error);
      throw new InternalError("Failed to create pickup request.");
    }
  }

  private static async validateWeightRange(weightRangeId: number) {
    const rows = await db
      .select()
      .from(weightRanges)
      .where(eq(weightRanges.id, weightRangeId))
      .limit(1);

    const weightRange = rows[0];

    if (!weightRange) {
      throw new NotFoundError("Weight range not found");
    }

    if (!weightRange.isActive) {
      throw new NotFoundError("Weight range is not active");
    }

    return weightRange;
  }

  private static validateCustomWeight(
    weight: number | null | undefined,
    weightRange: { minWeight: string; maxWeight: string }
  ) {
    if (weight === undefined || weight === null) {
      return;
    }

    const minWeight = Number(weightRange.minWeight);
    const maxWeight = Number(weightRange.maxWeight);

    if (weight < minWeight || weight > maxWeight) {
      throw new InternalError(
        `Weight ${weight} is outside the range ${minWeight} - ${maxWeight} kg`
      );
    }
  }

  private static validateHasServiceOrBundling(items: PickupItem[]) {
    const hasService = items.some((item) => !!item.serviceId);
    const hasBundling = items.some((item) => !!item.bundlingId);

    if (!(hasService || hasBundling)) {
      throw new InternalError(
        "Transaction must be at least have 1 service or bundling"
      );
    }
  }

  private static async enrichItemsWithMeta(
    items: PickupItem[]
  ): Promise<ItemWithMeta[]> {
    const serviceIds = items
      .filter((item) => !!item.serviceId)
      .map((item) => item.serviceId as string);

    const inventoryIds = items
      .filter((item) => !!item.inventoryId)
      .map((item) => item.inventoryId as string);

    const bundlingIds = items
      .filter((item) => !!item.bundlingId)
      .map((item) => item.bundlingId as string);

    const serviceResults =
      serviceIds.length > 0
        ? await db
            .select({
              id: services.id,
              maxWeight: services.maxWeight,
              isCustomerOrderable: services.isCustomerOrderable,
            })
            .from(services)
            .where(inArray(services.id, serviceIds))
        : [];

    const inventoryResults =
      inventoryIds.length > 0
        ? await db
            .select({
              id: inventories.id,
              maxWeight: inventories.maxWeight,
              isCustomerOrderable: inventories.isCustomerOrderable,
            })
            .from(inventories)
            .where(inArray(inventories.id, inventoryIds))
        : [];

    const bundlingResults =
      bundlingIds.length > 0
        ? await db
            .select({
              id: bundlings.id,
              maxWeight: bundlings.maxWeight,
              isCustomerOrderable: bundlings.isCustomerOrderable,
            })
            .from(bundlings)
            .where(inArray(bundlings.id, bundlingIds))
        : [];

    const itemMap = CustomerOrderService.buildItemMetaMap([
      ...serviceResults,
      ...inventoryResults,
      ...bundlingResults,
    ]);

    const result: ItemWithMeta[] = [];

    for (const item of items) {
      const id = CustomerOrderService.resolveItemId(item);

      if (!id) {
        continue;
      }

      const meta = itemMap.get(id);

      if (!meta?.isCustomerOrderable) {
        throw new InternalError(
          `Item ${id} is not available for customer orders`
        );
      }

      result.push({
        ...item,
        itemType: CustomerOrderService.determineItemType(item),
        maxWeight: meta.maxWeight,
      });
    }

    return result;
  }

  private static buildItemMetaMap(rows: ItemRow[]) {
    const map = new Map<
      string,
      { maxWeight: number | null; isCustomerOrderable: boolean | null }
    >();

    for (const row of rows) {
      const maxWeight = row.maxWeight === null ? null : Number(row.maxWeight);

      map.set(row.id, {
        maxWeight,
        isCustomerOrderable: row.isCustomerOrderable,
      });
    }

    return map;
  }

  private static resolveItemId(item: PickupItem): string | undefined {
    if (item.serviceId) {
      return item.serviceId;
    }

    if (item.inventoryId) {
      return item.inventoryId;
    }

    if (item.bundlingId) {
      return item.bundlingId;
    }

    return undefined;
  }

  private static determineItemType(
    item: PickupItem
  ): "service" | "inventory" | "bundling" {
    if (item.serviceId) {
      return "service";
    }

    if (item.inventoryId) {
      return "inventory";
    }

    return "bundling";
  }

  private static resolveItemQuantities(
    items: ItemWithMeta[],
    effectiveWeight: number
  ): ResolvedItem[] {
    const result: ResolvedItem[] = [];

    for (const item of items) {
      if (item.maxWeight === null) {
        const resolved = CustomerOrderService.resolveNonCapacityItem(item);
        result.push(resolved);
      } else {
        const resolved = CustomerOrderService.resolveCapacityItem(
          item,
          effectiveWeight
        );
        result.push(resolved);
      }
    }

    return result;
  }

  private static resolveNonCapacityItem(item: ItemWithMeta): ResolvedItem {
    if (item.quantity === undefined || item.quantity === null) {
      throw new InternalError(
        "Quantity is required for item without weight capacity"
      );
    }

    return {
      serviceId: item.serviceId ?? undefined,
      inventoryId: item.inventoryId ?? undefined,
      bundlingId: item.bundlingId ?? undefined,
      quantity: item.quantity,
      itemType: item.itemType,
    };
  }

  private static resolveCapacityItem(
    item: ItemWithMeta,
    effectiveWeight: number
  ): ResolvedItem {
    if (!item.maxWeight) {
      throw new InternalError(
        `Item ${item.serviceId || item.inventoryId || item.bundlingId} has no weight capacity`
      );
    }
    const minimumQuantity = Math.ceil(effectiveWeight / item.maxWeight);
    const quantity = item.quantity ?? minimumQuantity;

    if (quantity < minimumQuantity) {
      throw new InternalError(
        `Minimum quantity for this item is ${minimumQuantity}`
      );
    }

    return {
      serviceId: item.serviceId ?? undefined,
      inventoryId: item.inventoryId ?? undefined,
      bundlingId: item.bundlingId ?? undefined,
      quantity,
      itemType: item.itemType,
    };
  }

  private static buildItemDetails(
    resolvedItems: ResolvedItem[],
    itemPrices: Array<{ id: string; name: string; price: number }>
  ): ItemDetails[] {
    const details: ItemDetails[] = [];

    for (const item of resolvedItems) {
      const itemId = String(
        item.bundlingId || item.serviceId || item.inventoryId
      );
      const priceInfo = itemPrices.find(
        (p) =>
          p.id === item.bundlingId ||
          p.id === item.serviceId ||
          p.id === item.inventoryId
      );

      details.push({
        id: itemId,
        quantity: item.quantity,
        name: priceInfo?.name ?? "",
        price: priceInfo?.price ?? 0,
      });
    }

    return details;
  }

  static async createDeliveryRequest({
    userId,
    addressId,
    orderId,
    requestTime,
  }: RequestDeliveryParam) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    try {
      const newDeliveryId = await db.transaction(async (tx) => {
        const [existingDelivery] = await tx
          .select({
            id: deliveries.id,
          })
          .from(deliveries)
          .where(
            and(
              eq(deliveries.orderId, orderId),
              eq(deliveries.type, "delivery")
            )
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
            requestTime,
          })
          .returning({ id: deliveries.id });

        if (!newDelivery) {
          throw new InternalError("Failed to create delivery request");
        }

        return newDelivery.id;
      });

      return newDeliveryId;
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error creating delivery request:", error);
      throw new InternalError("Failed to create delivery request.");
    }
  }

  static async updateOrderItems(
    orderId: string,
    userId: string,
    body: UpdateOrderItemsBody
  ) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    const [pickupDelivery] = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(
        and(eq(deliveries.orderId, orderId), eq(deliveries.type, "pickup"))
      )
      .limit(1);

    if (!pickupDelivery) {
      throw new InternalError("Pickup has not been requested");
    }

    const [payment] = await db
      .select({
        transactionStatus: payments.transactionStatus,
        actions: payments.actions,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.transactionStatus !== "pending" || payment.actions !== null) {
      throw new InternalError(
        "Cannot update items after payment has been processed"
      );
    }

    const weightRange = await CustomerOrderService.validateWeightRange(
      body.weightRangeId
    );

    CustomerOrderService.validateCustomWeight(body.weight, weightRange);

    const editableItems = body.data.filter(
      (item) => !["voucher", "points"].includes(item.itemType)
    );

    if (!editableItems.length) {
      throw new InternalError("No items to update");
    }

    if (
      !editableItems.some(
        (item) => item.itemType === "service" || item.itemType === "bundling"
      )
    ) {
      throw new InternalError(
        "At least one service or bundling item is required"
      );
    }

    const seen = new Set<string>();
    for (const item of editableItems) {
      const key = `${item.itemType}:${item.itemId}`;
      if (seen.has(key)) {
        throw new InternalError("Duplicate items detected");
      }
      seen.add(key);
    }

    try {
      return await db.transaction(async (tx) =>
        CustomerOrderService._updateOrderItemsTransaction(
          tx,
          orderId,
          editableItems,
          body.weightRangeId,
          body.weight
        )
      );
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error updating order items:", error);
      throw new InternalError("Failed to update order items.");
    }
  }

  private static async _deleteRemovedEditableItems(
    tx: Transaction,
    existingOrderItems: Array<{
      id: string;
      itemType: string;
      serviceId: string | null;
      inventoryId: string | null;
      bundlingId: string | null;
    }>,
    bodyEntityIds: Set<string>
  ) {
    const idsToDelete = existingOrderItems
      .filter(
        (item) =>
          item.itemType !== "voucher" &&
          item.itemType !== "points" &&
          !bodyEntityIds.has(
            item.serviceId || item.inventoryId || item.bundlingId || ""
          )
      )
      .map((item) => item.id);

    if (idsToDelete.length > 0) {
      await tx.delete(orderItems).where(inArray(orderItems.id, idsToDelete));
    }
  }

  private static async _fetchPrices(
    tx: Transaction,
    editableItems: UpdateOrderItemsBody["data"]
  ) {
    const serviceIds = editableItems
      .filter((i) => i.itemType === "service")
      .map((i) => i.itemId);
    const inventoryIds = editableItems
      .filter((i) => i.itemType === "inventory")
      .map((i) => i.itemId);
    const bundlingIds = editableItems
      .filter((i) => i.itemType === "bundling")
      .map((i) => i.itemId);

    const [serviceRows, inventoryRows, bundlingRows] = await Promise.all([
      serviceIds.length > 0
        ? tx
            .select({ id: services.id, price: services.price })
            .from(services)
            .where(inArray(services.id, serviceIds))
        : [],
      inventoryIds.length > 0
        ? tx
            .select({ id: inventories.id, price: inventories.price })
            .from(inventories)
            .where(inArray(inventories.id, inventoryIds))
        : [],
      bundlingIds.length > 0
        ? tx
            .select({ id: bundlings.id, price: bundlings.price })
            .from(bundlings)
            .where(inArray(bundlings.id, bundlingIds))
        : [],
    ]);

    const foundIds = new Set([
      ...serviceRows.map((r) => r.id),
      ...inventoryRows.map((r) => r.id),
      ...bundlingRows.map((r) => r.id),
    ]);

    for (const item of editableItems) {
      if (!foundIds.has(item.itemId)) {
        throw new NotFoundError(`Item ${item.itemId} not found`);
      }
    }

    const priceMap = new Map<string, number>();
    for (const row of [...serviceRows, ...inventoryRows, ...bundlingRows]) {
      priceMap.set(row.id, Number(row.price));
    }
    return priceMap;
  }

  private static async _upsertOrderItems(
    tx: Transaction,
    orderId: string,
    editableItems: UpdateOrderItemsBody["data"],
    existingOrderItems: Array<{
      id: string;
      itemType: string;
      serviceId: string | null;
      inventoryId: string | null;
      bundlingId: string | null;
      note: string | null;
    }>,
    priceMap: Map<string, number>
  ) {
    const existingByEntityId = new Map<
      string,
      (typeof existingOrderItems)[number]
    >();
    for (const item of existingOrderItems) {
      if (item.itemType === "voucher" || item.itemType === "points") {
        continue;
      }
      const entityId = item.serviceId || item.inventoryId || item.bundlingId;
      if (entityId) {
        existingByEntityId.set(entityId, item);
      }
    }

    let newEditableTotal = 0;
    const bodyEntityIds = new Set<string>();

    for (const item of editableItems) {
      bodyEntityIds.add(item.itemId);
      const subtotal = item.quantity * (priceMap.get(item.itemId) ?? 0);
      newEditableTotal += subtotal;

      const existing = existingByEntityId.get(item.itemId);
      if (existing) {
        await tx
          .update(orderItems)
          .set({ quantity: item.quantity, subtotal })
          .where(eq(orderItems.id, existing.id));
      } else {
        const base = {
          orderId,
          itemType: item.itemType,
          quantity: item.quantity,
          subtotal,
          note: null as string | null,
        };
        if (item.itemType === "service") {
          await tx
            .insert(orderItems)
            .values({ ...base, serviceId: item.itemId });
        } else if (item.itemType === "inventory") {
          await tx
            .insert(orderItems)
            .values({ ...base, inventoryId: item.itemId });
        } else {
          await tx
            .insert(orderItems)
            .values({ ...base, bundlingId: item.itemId });
        }
      }
    }

    await CustomerOrderService._deleteRemovedEditableItems(
      tx,
      existingOrderItems,
      bodyEntityIds
    );

    return newEditableTotal;
  }

  private static async _updateOrderItemsTransaction(
    tx: Transaction,
    orderId: string,
    editableItems: UpdateOrderItemsBody["data"],
    weightRangeId: number,
    weight?: number | null
  ) {
    const existingOrderItems = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const nonEditableItems = existingOrderItems.filter(
      (item) => item.itemType === "voucher" || item.itemType === "points"
    );

    const priceMap = await CustomerOrderService._fetchPrices(tx, editableItems);

    const newEditableTotal = await CustomerOrderService._upsertOrderItems(
      tx,
      orderId,
      editableItems,
      existingOrderItems,
      priceMap
    );

    const nonEditableTotal = nonEditableItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const newTotal = newEditableTotal + nonEditableTotal;
    const discountAmount = -nonEditableTotal;

    await tx
      .update(payments)
      .set({ total: newTotal, amountPaid: newTotal, discountAmount })
      .where(eq(payments.orderId, orderId));

    const orderWeight =
      weight !== undefined && weight !== null ? String(weight) : null;

    await tx
      .update(ordersTable)
      .set({ weightRangeId, weight: orderWeight })
      .where(eq(ordersTable.id, orderId));

    return { total: newTotal };
  }

  static async cancelOrder(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    try {
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

        if (
          payment.transactionStatus !== "pending" ||
          payment.actions !== null
        ) {
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
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error cancelling order:", error);
      throw new InternalError("Failed to cancel order.");
    }
  }

  static async getOrderPaymentDetails(orderId: string, userId: string) {
    try {
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
          transactionTime: payments.transactionTime,
          expiryTime: payments.expiryTime,
          createdAt: payments.createdAt,
          updatedAt: paymentsTable.updatedAt,
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
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error fetching payment details:", error);
      throw new InternalError("Could not retrieve payment details.");
    }
  }

  static async chargeQrisPayment(orderId: string, userId: string) {
    await CustomerOrderService.verifyOrderOwnership(orderId, userId);

    try {
      await db.transaction(async (tx) => {
        await CustomerOrderService.validateOrderForCharge(tx, orderId);
        await CustomerOrderService.validatePickupDelivery(tx, orderId);
        const customerOrderItems =
          await CustomerOrderService.getChargeOrderItems(tx, orderId);
        const paymentDetail = await CustomerOrderService.getPaymentDetail(
          tx,
          orderId
        );
        const itemDetails =
          CustomerOrderService.buildQrisItemDetails(customerOrderItems);

        const chargeQrisData = CustomerOrderService.buildChargeQrisData(
          orderId,
          paymentDetail.total,
          itemDetails
        );
        const qrisResponse = await chargeQris(chargeQrisData);
        const paymentDataUpdate = CustomerOrderService.buildPaymentDataUpdate(
          orderId,
          paymentDetail.total,
          qrisResponse
        );

        await tx
          .update(payments)
          .set(paymentDataUpdate)
          .where(eq(payments.orderId, orderId));
      });
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error charging QRIS payment:", error);
      throw new InternalError("Failed to charge QRIS payment.");
    }
  }

  private static async validateOrderForCharge(
    tx: Transaction,
    orderId: string
  ) {
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

    if (!["pending", "processing"].includes(order.status)) {
      throw new InternalError(
        "Only pending or processing orders can be charged"
      );
    }

    return order;
  }

  private static async validatePickupDelivery(
    tx: Transaction,
    orderId: string
  ) {
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

    if (!["completed", "picked_up"].includes(pickupDelivery.status)) {
      throw new InternalError(
        "QRIS payment can only be charged after item picked up"
      );
    }

    return pickupDelivery;
  }

  private static async getChargeOrderItems(tx: Transaction, orderId: string) {
    const items = await tx
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

    if (!items.length) {
      throw new NotFoundError("Order items not found");
    }

    return items;
  }

  private static async getPaymentDetail(tx: Transaction, orderId: string) {
    const [paymentDetail] = await tx
      .select({ total: payments.total })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!paymentDetail) {
      throw new NotFoundError("Payment details not found");
    }

    return paymentDetail;
  }

  private static buildQrisItemDetails(items: CustomerOrderItem[]) {
    return items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.quantity > 0 ? Math.round(item.subtotal / item.quantity) : 0,
      name: item.name,
    }));
  }

  private static buildChargeQrisData(
    orderId: string,
    total: number,
    itemDetails: ItemDetails[]
  ): ChargeDetails {
    return {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
      qris: {
        acquirer: "gopay",
      },
      item_details: itemDetails,
    };
  }

  private static buildPaymentDataUpdate(
    orderId: string,
    total: number,
    qrisResponse: QrisTransactionResponse
  ): PaymentInsert {
    if (qrisResponse.status_code !== "201") {
      throw new InternalError("Unsupported payment type");
    }

    return {
      orderId,
      amountPaid: total,
      transactionStatus: "pending",
      total,
      fraudStatus: qrisResponse.fraud_status,
      transactionTime: qrisResponse.transaction_time,
      expiryTime: qrisResponse.expiry_time,
      qrString: qrisResponse.qr_string,
      acquirer: qrisResponse.acquirer,
      actions: qrisResponse.actions,
    };
  }
}
