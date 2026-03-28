import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { NotFoundError } from "@/exceptions";
import type { DeliveryDetail, DeliveryListItem } from "./model";

export abstract class CustomerDeliveriesService {
  private static async getMemberIdByUserId(userId: string): Promise<string> {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    return member.id;
  }

  static async getDeliveries(userId: string): Promise<DeliveryListItem[]> {
    const memberId =
      await CustomerDeliveriesService.getMemberIdByUserId(userId);

    const rows = await db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        type: deliveries.type,
        status: deliveries.status,
        address: addresses.address,
        date: deliveries.requestedAt,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(orders.memberId, memberId))
      .orderBy(desc(deliveries.requestedAt));

    return rows.map((row) => ({
      ...row,
      address: row.address,
      date: row.date ?? new Date().toISOString(),
    }));
  }

  static async getDeliveryById(
    userId: string,
    deliveryId: string
  ): Promise<DeliveryDetail> {
    const memberId =
      await CustomerDeliveriesService.getMemberIdByUserId(userId);

    const [row] = await db
      .select({
        id: deliveries.id,
        type: deliveries.type,
        status: deliveries.status,
        notes: deliveries.notes,
        requestedAt: deliveries.requestedAt,
        completedAt: deliveries.completedAt,
        orderId: deliveries.orderId,
        addressLabel: addresses.label,
        address: addresses.address,
        addressNotes: addresses.notes,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(and(eq(deliveries.id, deliveryId), eq(orders.memberId, memberId)))
      .limit(1);

    if (!row) {
      throw new NotFoundError("Delivery not found");
    }

    return {
      ...row,
      requestedAt: row.requestedAt ?? new Date().toISOString(),
      completedAt: row.completedAt ?? null,
    };
  }
}
