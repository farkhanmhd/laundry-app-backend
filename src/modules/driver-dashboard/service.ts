import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { routes } from "@/db/schema/routes";
import { vehicles } from "@/db/schema/vehicles";

export abstract class DriverDashboardService {
  static async getMetrics(driverId: string) {
    const [totalRoutes] = await db
      .select({ count: count() })
      .from(routes)
      .where(eq(routes.userId, driverId));

    const [deliveryCounts] = await db
      .select({
        totalPickups: sql<number>`COUNT(*) FILTER (WHERE ${deliveries.type} = 'pickup')`,
        totalDeliveries: sql<number>`COUNT(*) FILTER (WHERE ${deliveries.type} = 'delivery')`,
        inProgress: sql<number>`COUNT(*) FILTER (WHERE ${deliveries.status} = 'in_progress')`,
      })
      .from(deliveries)
      .innerJoin(routes, eq(deliveries.routeId, routes.id))
      .where(eq(routes.userId, driverId));

    return {
      totalRoutes: totalRoutes?.count ?? 0,
      totalPickups: Number(deliveryCounts?.totalPickups ?? 0),
      totalDeliveries: Number(deliveryCounts?.totalDeliveries ?? 0),
      inProgress: Number(deliveryCounts?.inProgress ?? 0),
    };
  }

  static async getActiveRoute(driverId: string) {
    const activeRoutes = await db
      .select({
        id: routes.id,
        vehicleId: routes.vehicleId,
        vehicleName: vehicles.name,
        vehicleLicensePlate: vehicles.licensePlate,
      })
      .from(routes)
      .leftJoin(vehicles, eq(routes.vehicleId, vehicles.id))
      .where(
        and(
          eq(routes.userId, driverId),
          sql`EXISTS (SELECT 1 FROM ${deliveries} WHERE ${deliveries.routeId} = ${routes.id} AND ${deliveries.status} NOT IN ('completed', 'cancelled'))`
        )
      )
      .limit(1);

    const activeRoute = activeRoutes[0];
    if (!activeRoute) {
      return null;
    }

    const stats = await db
      .select({
        status: deliveries.status,
        count: count(),
      })
      .from(deliveries)
      .where(eq(deliveries.routeId, activeRoute.id))
      .groupBy(deliveries.status);

    const totalDeliveries = stats.reduce((sum, s) => sum + Number(s.count), 0);
    const completedDeliveries = stats
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + Number(s.count), 0);

    return {
      id: activeRoute.id,
      vehicleId: activeRoute.vehicleId,
      vehicleName: activeRoute.vehicleName,
      vehicleLicensePlate: activeRoute.vehicleLicensePlate,
      totalDeliveries,
      completedDeliveries,
      progress:
        totalDeliveries > 0
          ? Math.round((completedDeliveries / totalDeliveries) * 100)
          : 0,
      statusBreakdown: stats.map((s) => ({
        name: s.status,
        value: Number(s.count),
      })),
    };
  }

  static async getRecentDeliveries(driverId: string, limit = 5) {
    const rows = await db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        type: deliveries.type,
        status: deliveries.status,
        customerName: members.name,
        address: addresses.address,
        requestedAt: deliveries.requestedAt,
      })
      .from(deliveries)
      .innerJoin(routes, eq(deliveries.routeId, routes.id))
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(members, eq(orders.memberId, members.id))
      .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
      .where(eq(routes.userId, driverId))
      .orderBy(desc(deliveries.requestedAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      requestedAt: row.requestedAt ?? new Date().toISOString(),
    }));
  }

  static async getDeliveryStatusDistribution(driverId: string) {
    const result = await db
      .select({
        name: deliveries.status,
        value: count(),
      })
      .from(deliveries)
      .innerJoin(routes, eq(deliveries.routeId, routes.id))
      .where(eq(routes.userId, driverId))
      .groupBy(deliveries.status);

    return result.map((row) => ({
      name: row.name,
      value: row.value,
    }));
  }
}
