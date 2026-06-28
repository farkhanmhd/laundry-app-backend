import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { vehicles } from "@/db/schema/vehicles";
import { InternalError, NotFoundError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";
import type { CreateVehicleSchema, UpdateVehicleSchema } from "./model";

export abstract class VehicleService {
  static async getVehicles(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;

    const searchByName = ilike(vehicles.name, `%${search}%`);
    const searchByPlate = ilike(vehicles.licensePlate, `%${search}%`);

    const whereQuery = and(
      isNull(vehicles.deletedAt),
      or(searchByName, searchByPlate)
    );

    const vehiclesQuery = db
      .select({
        id: vehicles.id,
        name: vehicles.name,
        ownerId: vehicles.ownerId,
        ownerName: user.name,
        licensePlate: vehicles.licensePlate,
      })
      .from(vehicles)
      .leftJoin(user, eq(vehicles.ownerId, user.id))
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(vehicles.name));

    const totalQuery = db
      .select({ count: count() })
      .from(vehicles)
      .where(whereQuery);

    const [vehicleList, totalResult] = await Promise.all([
      vehiclesQuery,
      totalQuery,
    ]);

    return { vehicles: vehicleList, total: totalResult[0]?.count ?? 0 };
  }

  static async getVehicle(id: string) {
    const [result] = await db
      .select({
        id: vehicles.id,
        name: vehicles.name,
        ownerId: vehicles.ownerId,
        ownerName: user.name,
        licensePlate: vehicles.licensePlate,
      })
      .from(vehicles)
      .leftJoin(user, eq(vehicles.ownerId, user.id))
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)));

    if (!result) {
      throw new NotFoundError("Vehicle not found");
    }

    return result;
  }

  static async createVehicle(body: CreateVehicleSchema) {
    const [result] = await db.insert(vehicles).values(body).returning({
      id: vehicles.id,
      name: vehicles.name,
      licensePlate: vehicles.licensePlate,
    });

    if (!result) {
      throw new InternalError("Failed to create vehicle");
    }

    return result;
  }

  static async updateVehicle(id: string, body: UpdateVehicleSchema) {
    const [result] = await db
      .update(vehicles)
      .set(body)
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
      .returning({ id: vehicles.id });

    if (!result) {
      throw new NotFoundError("Vehicle not found");
    }

    return result;
  }

  static async deleteVehicle(id: string) {
    const [result] = await db
      .update(vehicles)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
      .returning({ id: vehicles.id });

    if (!result) {
      throw new NotFoundError("Vehicle not found");
    }

    return result.id;
  }
}
