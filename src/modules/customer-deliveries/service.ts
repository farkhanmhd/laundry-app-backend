import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { NotFoundError } from "@/exceptions";
import type { DeliveryDetail } from "./model";

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

  static async getDeliveries(userId: string, page = 1) {
    const memberId =
      await CustomerDeliveriesService.getMemberIdByUserId(userId);
    const limit = 5;
    const offset = (page - 1) * limit;

    const dataQuery = db
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
      .limit(limit)
      .offset(offset)
      .orderBy(desc(deliveries.requestedAt));

    const totalQuery = db
      .select({ count: count() })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .where(eq(orders.memberId, memberId));

    const [rows, totalResult] = await Promise.all([dataQuery, totalQuery]);

    const data = rows.map((row) => ({
      ...row,
      address: row.address,
      date: row.date ?? new Date().toISOString(),
    }));

    const totalData = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalData / limit);

    return {
      data,
      totalData,
      totalPages,
    };
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
