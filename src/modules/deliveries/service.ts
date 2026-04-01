import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";

export abstract class DeliveriesService {
  static async getPickups(
    search?: string,
    limit = 10,
    page = 1,
    status?: string
  ){
    const offset = (page - 1) * limit;

    const conditions = [eq(deliveries.type, "pickup")];

    if (status) {
      conditions.push(
        eq(
          deliveries.status,
          status as "requested" | "in_progress" | "completed" | "cancelled"
        )
      );
    }

    if (search) {
      conditions.push(ilike(members.name, `%${search}%`));
    }

    const dataQuery = db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        routeId: deliveries.routeId,
        customerName: members.name,
        customerPhone: members.phone,
        address: addresses.address,
        status: deliveries.status,
        requestedAt: deliveries.requestedAt,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(deliveries.requestedAt));

    const totalQuery = db
      .select({ count: count() })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .where(
        and(
          eq(deliveries.type, "pickup"),
          ...(search ? [ilike(members.name, `%${search}%`)] : [])
        )
      );

    const [data, totalResult] = await Promise.all([dataQuery, totalQuery]);

    const totalData = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalData / limit);

    return {
      data: data.map((row) => ({
        ...row,
        requestedAt: row.requestedAt ?? new Date().toISOString(),
      })),
      totalData,
      totalPages,
    };
  }

  static async getDeliveries(
    search?: string,
    limit = 10,
    page = 1,
    status?: string
  ){
    const offset = (page - 1) * limit;

    const conditions = [eq(deliveries.type, "delivery")];

    if (status) {
      conditions.push(
        eq(
          deliveries.status,
          status as "requested" | "in_progress" | "completed" | "cancelled"
        )
      );
    }

    if (search) {
      conditions.push(ilike(members.name, `%${search}%`));
    }

    const dataQuery = db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        routeId: deliveries.routeId,
        customerName: members.name,
        customerPhone: members.phone,
        address: addresses.address,
        status: deliveries.status,
        requestedAt: deliveries.requestedAt,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(deliveries.requestedAt));

    const totalQuery = db
      .select({ count: count() })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .where(
        and(
          eq(deliveries.type, "delivery"),
          ...(search ? [ilike(members.name, `%${search}%`)] : [])
        )
      );

    const [data, totalResult] = await Promise.all([dataQuery, totalQuery]);

    const totalData = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalData / limit);

    return {
      data: data.map((row) => ({
        ...row,
        requestedAt: row.requestedAt ?? new Date().toISOString(),
      })) ,
      totalData,
      totalPages,
    };
  }
}
