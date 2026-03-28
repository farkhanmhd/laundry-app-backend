import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders as ordersTable } from "@/db/schema/orders";
import { payments as paymentsTable } from "@/db/schema/payments";
import { vouchers } from "@/db/schema/vouchers";
import { NotFoundError } from "@/exceptions";
import type { DeliveryListItem } from "../customer-deliveries/model";

export abstract class CustomerDashboardService {
  static async getCustomerInfo(userId: string) {
    const [member] = await db
      .select({
        name: members.name,
        phone: members.phone,
        points: members.points,
      })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    return member;
  }

  static async getLatestOrders(userId: string, limit = 3) {
    const rows = await db
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
      .orderBy(desc(ordersTable.createdAt));

    return rows;
  }

  static async getLatestDeliveries(
    userId: string,
    limit = 3
  ): Promise<DeliveryListItem[]> {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (!member) {
      throw new NotFoundError("Member not found");
    }

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
      .innerJoin(ordersTable, eq(deliveries.orderId, ordersTable.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(ordersTable.memberId, member.id))
      .orderBy(desc(deliveries.requestedAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      address: row.address,
      date: row.date ?? new Date().toISOString(),
    }));
  }

  static async getVisibleVouchers(limit = 3) {
    const rows = await db
      .select()
      .from(vouchers)
      .where(
        and(gt(vouchers.expiresAt, sql`now()`), eq(vouchers.isVisible, true))
      )
      .orderBy(desc(vouchers.createdAt))
      .limit(limit);

    return rows;
  }
}
