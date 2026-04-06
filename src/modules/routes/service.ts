import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { routes } from "@/db/schema/routes";
import { NotFoundError } from "@/exceptions";

export abstract class RoutesService {
  static async getRouteById(routeId: string) {
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);

    if (!route) {
      throw new NotFoundError("Route not found");
    }

    const deliveriesData = await db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        addressId: addresses.id,
        index: deliveries.index,
        type: deliveries.type,
        status: deliveries.status,
        notes: addresses.notes,
        requestedAt: deliveries.requestedAt,
        completedAt: deliveries.completedAt,
        customerName: members.name,
        customerPhone: members.phone,
        addressLabel: addresses.label,
        address: addresses.address,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(deliveries.routeId, routeId))
      .orderBy(asc(deliveries.index));

    return {
      id: route.id,
      userId: route.userId,
      deliveries: deliveriesData,
    };
  }
}
