import { write } from "bun";
import { and, desc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bundlingItems } from "@/db/schema/bundling-items";
import { bundlings } from "@/db/schema/bundlings";
import { services } from "@/db/schema/services";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import type {
  AddServiceBody,
  UpdateServiceBody,
  UpdateServiceImage,
} from "./model";

export abstract class Services {
  static async getServices() {
    try {
      const rows = await db
        .select({
          ...getTableColumns(services),
          isOnBundling: sql<boolean>`COUNT(${bundlings.id}) > 0`,
        })
        .from(services)
        .leftJoin(bundlingItems, eq(bundlingItems.serviceId, services.id))
        .leftJoin(
          bundlings,
          and(
            eq(bundlings.id, bundlingItems.bundlingId),
            isNull(bundlings.deletedAt)
          )
        )
        .where(isNull(services.deletedAt))
        .orderBy(desc(services.createdAt))
        .groupBy(services.id);
      return rows;
    } catch (error) {
      console.error("Error fetching services:", error);
      throw new InternalError("Could not retrieve services.");
    }
  }

  static async getServiceById(id: string) {
    const row = await db
      .select()
      .from(services)
      .where(and(eq(services.id, id), isNull(services.deletedAt)))
      .limit(1);

    if (!row.length) {
      throw new NotFoundError("Service not found");
    }

    return row[0];
  }

  static async addService(formData: AddServiceBody) {
    const { image, ...data } = formData;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    try {
      const result = await db
        .insert(services)
        .values({
          ...data,
          image: imageUrl,
        })
        .returning({ id: services.id });

      if (!result.length) {
        throw new InternalError("Failed to create the new service.");
      }

      return result[0]?.id as string;
    } catch (error) {
      if (error instanceof InternalError) {
        throw error;
      }
      console.error("Error creating service:", error);
      throw new InternalError("Failed to create the new service.");
    }
  }

  static async updateService(id: string, data: UpdateServiceBody) {
    try {
      const result = await db
        .update(services)
        .set({ ...data, updatedAt: sql`now()` })
        .where(eq(services.id, id))
        .returning({ id: services.id });

      if (!result.length) {
        throw new NotFoundError("Service not found");
      }

      return result[0]?.id as string;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error updating service:", error);
      throw new InternalError("Failed to update the service.");
    }
  }

  static async updateServiceImage(id: string, data: UpdateServiceImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    try {
      const result = await db
        .update(services)
        .set({ image: imageUrl })
        .where(eq(services.id, id))
        .returning({ id: services.id });

      if (!result.length) {
        throw new NotFoundError("Service not found");
      }

      return result[0]?.id as string;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error updating service image:", error);
      throw new InternalError("Failed to update the service image.");
    }
  }

  static async deleteService(id: string) {
    const bundling = await db
      .select({ id: bundlingItems.id })
      .from(bundlingItems)
      .where(eq(bundlingItems.serviceId, id))
      .limit(1);

    if (bundling.length) {
      throw new ConflictError("Service is used in bundling items");
    }

    try {
      const result = await db
        .update(services)
        .set({ deletedAt: sql`now()` })
        .where(eq(services.id, id))
        .returning({ id: services.id });

      if (!result.length) {
        throw new InternalError("Service id not valid");
      }

      return result[0]?.id as string;
    } catch (error) {
      if (error instanceof InternalError || error instanceof ConflictError) {
        throw error;
      }
      console.error("Error deleting service:", error);
      throw new InternalError("Failed to delete the service.");
    }
  }
}
