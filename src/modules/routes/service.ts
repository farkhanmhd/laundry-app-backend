import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { routes } from "@/db/schema/routes";
import { InternalError, NotFoundError } from "@/exceptions";

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

  static async finishRoute(routeId: string) {
    return await db.transaction(async (tx) => {
      const [route] = await tx
        .select()
        .from(routes)
        .where(eq(routes.id, routeId))
        .limit(1);

      if (!route) {
        throw new NotFoundError("Route not found");
      }

      const routeDeliveries = await tx
        .select({
          status: deliveries.status,
          orderId: deliveries.orderId,
          type: deliveries.type,
        })
        .from(deliveries)
        .where(eq(deliveries.routeId, routeId));

      if (routeDeliveries.length === 0) {
        throw new NotFoundError("No deliveries found for this route");
      }

      const allPickedUp = routeDeliveries.every(
        (delivery) => delivery.status === "picked_up"
      );

      if (!allPickedUp) {
        throw new InternalError(
          "Cannot finish route: Not all deliveries are picked up"
        );
      }

      await tx
        .update(deliveries)
        .set({ status: "completed" })
        .where(eq(deliveries.routeId, routeId));

      // if delivery type is pickup, update the order statuses as processing
      const pickupOrderIds = routeDeliveries
        .filter((delivery) => delivery.type === "pickup")
        .map((delivery) => delivery.orderId);

      if (pickupOrderIds.length > 0) {
        await tx
          .update(orders)
          .set({ status: "processing" })
          .where(inArray(orders.id, pickupOrderIds));
      }

      // if delivery type is delivery, update the order statuses to completed
      const deliveryOrderIds = routeDeliveries
        .filter((delivery) => delivery.type === "delivery")
        .map((delivery) => delivery.orderId);

      if (deliveryOrderIds.length > 0) {
        await tx
          .update(orders)
          .set({ status: "completed" })
          .where(inArray(orders.id, deliveryOrderIds));
      }

      return true;
    });
  }
}
