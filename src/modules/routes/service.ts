import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { assets } from "@/db/schema/assets";
import { user } from "@/db/schema/auth";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
import { routes } from "@/db/schema/routes";
import { AuthorizationError, InternalError, NotFoundError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";

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
        pickupImage: deliveries.pickupImage,
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

      const pickupOrderIds = routeDeliveries
        .filter((delivery) => delivery.type === "pickup")
        .map((delivery) => delivery.orderId);

      if (pickupOrderIds.length > 0) {
        const paidPickUpOrderIds = await tx
          .select({ id: payments.orderId })
          .from(payments)
          .where(
            and(
              inArray(payments.orderId, pickupOrderIds),
              eq(payments.transactionStatus, "settlement")
            )
          );

        const paidOrderIds = paidPickUpOrderIds.map((p) => p.id);

        if (paidOrderIds.length > 0) {
          await tx
            .update(orders)
            .set({ status: "processing" })
            .where(inArray(orders.id, paidOrderIds));
        }
      }

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

  static async verifyRouteAccess(userId: string, role: string) {
    if (role === "superadmin") {
      return;
    }

    if (role !== "driver") {
      throw new AuthorizationError();
    }

    const [route] = await db
      .select({ userId: routes.userId })
      .from(routes)
      .where(eq(routes.userId, userId))
      .limit(1);

    if (!route || route.userId !== userId) {
      throw new AuthorizationError();
    }
  }

  static async getRoutes(role: string, userId: string, query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;

    const filters: SQL[] = [];
    if (role !== "superadmin") {
      filters.push(eq(routes.userId, userId));
    }

    if (search) {
      const searchByRouteId = ilike(routes.id, `%${search}%`);
      const searchByDriverName = ilike(user.name, `%${search}%`);
      const searchLogic = or(searchByRouteId, searchByDriverName);
      if (searchLogic) {
        filters.push(searchLogic);
      }
    }

    const whereQuery = filters.length > 0 ? and(...filters) : undefined;

    const routesQuery = db
      .select({
        id: routes.id,
        userId: routes.userId,
        driverName: user.name,
        assetId: routes.assetId,
        assetName: assets.name,
        assetLicensePlate: assets.licensePlate,
        deliveryCount: count(deliveries.id),
        completedCount: sql<number>`COUNT(*) FILTER (WHERE ${deliveries.status} IN ('completed', 'cancelled'))`,
      })
      .from(routes)
      .leftJoin(user, eq(routes.userId, user.id))
      .leftJoin(assets, eq(routes.assetId, assets.id))
      .leftJoin(deliveries, eq(routes.id, deliveries.routeId))
      .where(whereQuery)
      .groupBy(routes.id, user.name, assets.name, assets.licensePlate)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(sql`MAX(${deliveries.requestedAt}) DESC NULLS LAST`);

    const totalQuery = db
      .select({ count: count() })
      .from(routes)
      .where(whereQuery);

    const [routesData, [total]] = await Promise.all([routesQuery, totalQuery]);

    return { routes: routesData, total: total?.count ?? 0 };
  }
}
