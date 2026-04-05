import { and, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { routes } from "@/db/schema/routes";
import { InternalError, NotFoundError } from "@/exceptions";
import { LAUNDRY_POINT_ZERO } from "@/utils";

export type OSRMTripResponse = {
  code:
    | "Ok"
    | "NoTrips"
    | "NotImplemented"
    | "InvalidUrl"
    | "InvalidService"
    | "InvalidVersion"
    | "InvalidOptions"
    | "InvalidQuery"
    | "InvalidValue"
    | "NoSegment"
    | "TooBig";
  message?: string;
  trips: OSRMTrip[];
  waypoints: OSRMTripWaypoint[];
};

export type OSRMTrip = {
  duration: number; // total seconds
  distance: number; // total meters
  weight: number;
  weight_name: string;
  legs: OSRMTripLeg[];
  geometry?: string; // present if overview != false
};

export type OSRMTripLeg = {
  duration: number; // seconds
  distance: number; // meters
  weight: number;
  summary: string;
  steps: OSRMRouteStep[]; // populated if steps=true
};

export type OSRMRouteStep = {
  distance: number;
  duration: number;
  weight: number;
  name: string;
  mode: string;
  geometry: string;
  maneuver: {
    location: [number, number];
    bearing_before: number;
    bearing_after: number;
    type: string;
    modifier?: string;
  };
};

export type OSRMTripWaypoint = {
  waypoint_index: number; // position in the optimized route
  trips_index: number; // which trip this waypoint belongs to
  distance: number; // meters from input coord to snapped coord
  name: string;
  location: [number, number]; // [longitude, latitude]
  hint: string;
};

export abstract class DeliveriesService {
  static async getPickups(
    search?: string,
    limit = 10,
    page = 1,
    status?: string
  ) {
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
        addressId: addresses.id,
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
  ) {
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
        addressId: addresses.id,
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
      })),
      totalData,
      totalPages,
    };
  }

  static async createDeliveryRoute({
    orderIds,
    userId,
  }: {
    orderIds: string[];
    userId: string;
  }) {
    const newRouteId = await db.transaction(async (tx) => {
      const selectedAddresses = await tx
        .select({
          id: addresses.id,
          latitude: addresses.latitude,
          longitude: addresses.longitude,
          orderId: orders.id,
          deliveryId: deliveries.id,
        })
        .from(addresses)
        .innerJoin(deliveries, eq(deliveries.addressId, addresses.id))
        .innerJoin(orders, eq(orders.id, deliveries.orderId))
        .where(inArray(orders.id, orderIds));

      if (selectedAddresses.length !== orderIds.length) {
        const foundOrderIds = new Set(selectedAddresses.map((a) => a.orderId));
        const missingId = orderIds.find((id) => !foundOrderIds.has(id));
        throw new NotFoundError(`No addresses found for order id ${missingId}`);
      }

      // create new optimized route with osrm
      // url example 'http://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407;13.428555,52.523219?overview=false'

      const customerAddresses = selectedAddresses.map((address) => {
        return `${address.longitude},${address.latitude}`;
      });

      const coordinates: string = [
        LAUNDRY_POINT_ZERO,
        ...customerAddresses,
      ].join(";");

      const osrmRequestUrl = `http://router.project-osrm.org/trip/v1/driving/${coordinates}?roundtrip=true&source=first&overview=false`;

      const osrmResponse = await fetch(osrmRequestUrl);

      const osrmData = (await osrmResponse.json()) as OSRMTripResponse;

      if (osrmData.code !== "Ok") {
        throw new InternalError(`OSRM Trip failed: ${osrmData.code}`);
      }

      const [newRoute] = await tx
        .insert(routes)
        .values({
          userId,
        })
        .returning({ id: routes.id });

      if (!newRoute) {
        throw new InternalError("Failed to create new route id.");
      }

      await Promise.all(
        selectedAddresses.map((address, i) => {
          const optimizedIndex = osrmData.waypoints[i + 1]?.waypoint_index;
          return tx
            .update(deliveries)
            .set({ routeId: newRoute.id, index: optimizedIndex })
            .where(eq(deliveries.id, address.deliveryId));
        })
      );

      return newRoute.id;
    });

    return newRouteId;
  }
}
