import { write } from "bun";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema/services";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import { POS_CACHE_KEY } from "../pos/service";
import type {
  AddServiceBody,
  Service,
  UpdateServiceBody,
  UpdateServiceImage,
} from "./model";

const SERVICE_CACHE_KEY = "service:all";

export abstract class Services {
  static async getServices() {
    const json = await redis.get(SERVICE_CACHE_KEY);

    if (json) {
      return JSON.parse(json) as Service[];
    }

    const rows: Service[] = await db
      .select()
      .from(services)
      .where(isNull(services.deletedAt))
      .orderBy(desc(services.createdAt));

    await redis.set(SERVICE_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }

  static async getServiceById(id: string) {
    const cacheKey = `service:${id}`;
    const json = await redis.get(cacheKey);
    if (json) {
      return JSON.parse(json) as Service;
    }
    const row = await db
      .select()
      .from(services)
      .where(and(eq(services.id, id), isNull(services.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

    await redis.set(cacheKey, JSON.stringify(row[0]), "EX", 3600);
    return row[0] as Service;
  }

  static async addService(formData: AddServiceBody) {
    const { image, ...data } = formData;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    const result = await db
      .insert(services)
      .values({
        ...data,
        image: imageUrl,
      })
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(SERVICE_CACHE_KEY);
    await redis.del(POS_CACHE_KEY);

    return result[0]?.id as string;
  }

  static async updateService(id: string, data: UpdateServiceBody) {
    const result = await db
      .update(services)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(services.id, id))
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(SERVICE_CACHE_KEY);

    return result[0]?.id as string;
  }

  static async updateServiceImage(id: string, data: UpdateServiceImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    const result = await db
      .update(services)
      .set({ image: imageUrl })
      .where(eq(services.id, id))
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(SERVICE_CACHE_KEY);

    return result[0]?.id as string;
  }

  static async deleteService(id: string) {
    const result = await db
      .update(services)
      .set({ deletedAt: sql`now()` })
      .where(eq(services.id, id))
      .returning({ id: services.id, image: services.image });

    if (!result.length) {
      throw new InternalError("Service id not valid");
    }

    await redis.del(SERVICE_CACHE_KEY);
    await redis.del(POS_CACHE_KEY);

    return result[0]?.id as string;
  }
}
