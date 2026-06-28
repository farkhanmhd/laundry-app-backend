import { file, write } from "bun";
import { and, count, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { user } from "@/db/schema/auth";
import { deliveries } from "@/db/schema/deliveries";
import { members } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { routes } from "@/db/schema/routes";
import { vehicles } from "@/db/schema/vehicles";
import { InternalError, NotFoundError } from "@/exceptions";
import { LAUNDRY_POINT_ZERO } from "@/utils";
import type { DeliveriesQuery } from "./model";

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
  duration: number;
  distance: number;
  weight: number;
  weight_name: string;
  legs: OSRMTripLeg[];
  geometry?: string;
};

export type OSRMTripLeg = {
  duration: number;
  distance: number;
  weight: number;
  summary: string;
  steps: OSRMRouteStep[];
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
  waypoint_index: number;
  trips_index: number;
  distance: number;
  name: string;
  location: [number, number];
  hint: string;
};

export abstract class DeliveriesService {
  static async getPickups(
    search?: string,
    limit = 50,
    page = 1,
    status?: DeliveriesQuery["status"]
  ) {
    try {
      const offset = (page - 1) * limit;

      const conditions = [eq(deliveries.type, "pickup")];

      if (status && status.length > 0) {
        conditions.push(inArray(deliveries.status, status));
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
          driverName: user.name,
          vehicleId: vehicles.id,
          licensePlate: vehicles.licensePlate,
          vehicleName: vehicles.name,
          requestTime: deliveries.requestTime,
          requestedAt: deliveries.requestedAt,
        })
        .from(deliveries)
        .innerJoin(orders, eq(deliveries.orderId, orders.id))
        .innerJoin(members, eq(orders.memberId, members.id))
        .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
        .leftJoin(routes, eq(deliveries.routeId, routes.id))
        .leftJoin(vehicles, eq(routes.vehicleId, vehicles.id))
        .leftJoin(user, eq(routes.userId, user.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${deliveries.requestTime} DESC NULLS LAST`);

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
    } catch (error) {
      console.error("Error fetching pickups:", error);
      throw new InternalError("Could not retrieve pickups.");
    }
  }

  static async getDeliveries(
    search?: string,
    limit = 10,
    page = 1,
    status?: DeliveriesQuery["status"]
  ) {
    try {
      const offset = (page - 1) * limit;

      const conditions = [eq(deliveries.type, "delivery")];

      if (status && status.length > 0) {
        conditions.push(inArray(deliveries.status, status));
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
          vehicleId: vehicles.id,
          driverName: user.name,
          licensePlate: vehicles.licensePlate,
          vehicleName: vehicles.name,
          requestTime: deliveries.requestTime,
          requestedAt: deliveries.requestedAt,
        })
        .from(deliveries)
        .innerJoin(orders, eq(deliveries.orderId, orders.id))
        .innerJoin(members, eq(orders.memberId, members.id))
        .innerJoin(addresses, eq(deliveries.addressId, addresses.id))
        .leftJoin(routes, eq(deliveries.routeId, routes.id))
        .leftJoin(vehicles, eq(routes.vehicleId, vehicles.id))
        .leftJoin(user, eq(routes.userId, user.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${deliveries.requestTime} DESC NULLS LAST`);

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
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      throw new InternalError("Could not retrieve deliveries.");
    }
  }

  static async createDeliveryRoute({
    deliveryIds,
    driverId,
    vehicleId,
  }: {
    deliveryIds: string[];
    driverId: string;
    vehicleId: string;
  }) {
    try {
      const newRouteId = await db.transaction(async (tx) => {
        const getDriverQuery = tx
          .select({ id: user.id })
          .from(user)
          .where(and(eq(user.id, driverId), eq(user.role, "driver")))
          .limit(1);

        const getVehicleQuery = tx
          .select({ id: vehicles.id })
          .from(vehicles)
          .where(and(eq(vehicles.id, vehicleId), isNull(vehicles.deletedAt)))
          .limit(1);

        const [driver, vehicle] = await Promise.all([
          getDriverQuery,
          getVehicleQuery,
        ]);

        if (!driver) {
          throw new NotFoundError(`Driver not found with id ${driverId}`);
        }

        if (!vehicle) {
          throw new NotFoundError(`Vehicle not found with id ${vehicleId}`);
        }

        const selectedAddresses = await tx
          .select({
            id: addresses.id,
            latitude: addresses.latitude,
            longitude: addresses.longitude,
            orderId: deliveries.orderId,
            deliveryId: deliveries.id,
          })
          .from(addresses)
          .innerJoin(deliveries, eq(deliveries.addressId, addresses.id))
          .where(inArray(deliveries.id, deliveryIds));

        if (selectedAddresses.length !== deliveryIds.length) {
          const foundDeliveryIds = new Set(
            selectedAddresses.map((a) => a.deliveryId)
          );
          const missingId = deliveryIds.find((id) => !foundDeliveryIds.has(id));
          throw new NotFoundError(
            `No address found for delivery id ${missingId}`
          );
        }

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
            userId: driverId,
            vehicleId,
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
              .set({
                routeId: newRoute.id,
                index: optimizedIndex,
                status: "in_progress",
              })
              .where(eq(deliveries.id, address.deliveryId));
          })
        );

        return newRoute.id;
      });

      return newRouteId;
    } catch (error) {
      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error creating delivery route:", error);
      throw new InternalError("Failed to create delivery route.");
    }
  }

  static async updateDeliveryStatus(deliveryId: string, image?: File) {
    let imagePath: string | undefined;

    try {
      if (image) {
        const ext = image.name.split(".").pop() ?? "jpg";
        const filename = `pickup-${deliveryId}-${Date.now()}.${ext}`;
        imagePath = `public/uploads/${filename}`;
        await write(imagePath, image);
      }

      const pickupImageUrl = imagePath
        ? `${process.env.BETTER_AUTH_URL}/uploads/${imagePath.split("/").pop()}`
        : undefined;

      return await db.transaction(async (tx) => {
        const [delivery] = await tx
          .select({ status: deliveries.status })
          .from(deliveries)
          .where(eq(deliveries.id, deliveryId))
          .limit(1);

        if (!delivery) {
          throw new NotFoundError("Delivery ID not found");
        }

        const currentStatus = delivery.status;
        let newStatus: typeof currentStatus;

        if (currentStatus === "in_progress") {
          newStatus = "picked_up" as typeof currentStatus;
        } else {
          throw new InternalError(
            `Cannot update delivery status from ${currentStatus}`
          );
        }

        await tx
          .update(deliveries)
          .set({
            status: newStatus,
            ...(pickupImageUrl ? { pickupImage: pickupImageUrl } : {}),
          })
          .where(eq(deliveries.id, deliveryId));

        return {
          id: deliveryId,
          oldStatus: currentStatus,
          newStatus,
          pickupImage: pickupImageUrl ?? null,
        };
      });
    } catch (error) {
      if (imagePath) {
        await file(imagePath).delete();
      }

      if (error instanceof InternalError || error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error updating delivery status:", error);
      throw new InternalError("Failed to update delivery status.");
    }
  }
}
