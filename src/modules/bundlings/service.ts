import { file, write } from "bun";
import { desc, eq, sql } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "@/db";
import { bundlingItems } from "@/db/schema/bundling-items";
import { bundlings } from "@/db/schema/bundlings";
import { InternalError } from "@/exceptions";
import { redis } from "@/redis";
import type {
  AddBundlingBody,
  Bundling,
  BundlingWithItem,
  UpdateBundlingData,
} from "./model";

const BUNDLINGS_CACHE_KEY = "bundlings:all";

export abstract class Bundlings {
  static async getBundlings() {
    const json = await redis.get(BUNDLINGS_CACHE_KEY);

    if (json) {
      return JSON.parse(json) as Bundling[];
    }

    const rows = await db
      .select()
      .from(bundlings)
      .orderBy(desc(bundlings.createdAt));

    await redis.set(BUNDLINGS_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }

  static async getBundlingById(id: string) {
    const cacheKey = `bundlings:${id}`;
    const json = await redis.get(cacheKey);

    if (json) {
      return JSON.parse(json) as BundlingWithItem;
    }

    const dataQuery = db
      .select()
      .from(bundlings)
      .where(eq(bundlings.id, id))
      .limit(1);

    const itemsQuery = db
      .select()
      .from(bundlingItems)
      .where(eq(bundlingItems.bundlingId, id));

    const [bundlingRows, itemRows] = await Promise.all([dataQuery, itemsQuery]);

    const [bundlingData] = bundlingRows;

    if (!bundlingData) {
      throw new NotFoundError(`Bundling with id ${id} not found`);
    }

    const result: BundlingWithItem = {
      ...bundlingData,
      items: itemRows,
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);

    return result;
  }

  static async addBundling(data: AddBundlingBody) {
    const { items, image, ...bundlingData } = data;
    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;
    await write(fullPath, image);

    try {
      const newBundlingId = await db.transaction(async (tx) => {
        const [insertedBundling] = await tx
          .insert(bundlings)
          .values({ ...bundlingData, image: imageUrl })
          .returning({ id: bundlings.id });

        if (!insertedBundling) {
          throw new InternalError("Failed to insert bundling record");
        }

        const itemsWithRelation = items.map((item) => ({
          ...item,
          bundlingId: insertedBundling.id,
        }));

        if (itemsWithRelation.length > 0) {
          await tx.insert(bundlingItems).values(itemsWithRelation);
        }

        return insertedBundling.id;
      });

      await redis.del(BUNDLINGS_CACHE_KEY);
      return newBundlingId;
    } catch (error) {
      console.error("Transaction failed ", error);
      const imageFile = file(fullPath);
      if (await imageFile.exists()) {
        await imageFile.delete();
      }

      throw new InternalError("Failed to create bundling");
    }
  }

  static async updateBundlingData(id: string, data: UpdateBundlingData) {
    const result = await db
      .update(bundlings)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(bundlings.id, id))
      .returning({ id: bundlings.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(BUNDLINGS_CACHE_KEY);
    await redis.del(`bundlings:${id}`);

    return result[0]?.id as string;
  }
}
