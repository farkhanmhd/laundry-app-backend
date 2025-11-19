import { write } from "bun";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventories } from "@/db/schema/inventories";
import { stockAdjustments } from "@/db/schema/stock-adjustments";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type {
  AddInventoryBody,
  AdjustQuantitySchema,
  Inventory,
  UpdateInventoryBody,
  UpdateInventoryImage,
} from "./model";

const INVENTORIES_CACHE_KEY = "inventories:all";

export abstract class Inventories {
  static async getInventories() {
    const json = await redis.get(INVENTORIES_CACHE_KEY);

    if (json) {
      return JSON.parse(json) as Inventory[];
    }

    const rows = await db
      .select()
      .from(inventories)
      .orderBy(desc(inventories.createdAt));

    await redis.set(INVENTORIES_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }

  static async addInventory(formData: AddInventoryBody) {
    const { name, image, price, stock, safetyStock, description } = formData;
    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;
    await write(fullPath, image);
    const result = await db
      .insert(inventories)
      .values({
        name: name as string,
        description: description as string,
        image: imageUrl,
        price,
        stock,
        safetyStock,
      })
      .returning(); // return all columns
    if (result.length === 0) {
      throw new InternalError();
    }
    const row = result[0]; // safe because result.length > 0
    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.set(`inventories:${row?.id}`, JSON.stringify(row), "EX", 3600);
    return row;
  }

  static async getInventoryById(id: string) {
    const cacheKey = `inventories:${id}`;
    const json = await redis.get(cacheKey);
    if (json) {
      return JSON.parse(json) as Inventory;
    }
    const row = await db
      .select()
      .from(inventories)
      .where(and(eq(inventories.id, id), isNull(inventories.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

    await redis.set(cacheKey, JSON.stringify(row[0]), "EX", 3600);
    return row[0] as Inventory;
  }

  static async updateInventory(id: string, data: UpdateInventoryBody) {
    const result = await db
      .update(inventories)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(inventories.id, id))
      .returning({ id: inventories.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(`inventories:${id}`);

    return result[0]?.id as string;
  }

  static async updateInventoryImage(id: string, data: UpdateInventoryImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    const result = await db
      .update(inventories)
      .set({ image: imageUrl })
      .where(eq(inventories.id, id))
      .returning({ id: inventories.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(`inventories:${id}`);

    return result[0]?.id as string;
  }

  static async adjustQuantity(
    userId: string,
    inventoryId: string,
    body: AdjustQuantitySchema
  ) {
    const stockAdjustmentId = await db.transaction(async (tx) => {
      const selectedInventory = (
        await tx
          .select({
            inventoryId: inventories.id,
            previousQuantity: inventories.stock,
          })
          .from(inventories)
          .where(eq(inventories.id, inventoryId))
          .limit(1)
      )[0];

      if (!selectedInventory) {
        tx.rollback();
        throw new NotFoundError("Inventory Id not found");
      }

      const stockAdjustment = (
        await tx
          .insert(stockAdjustments)
          .values({
            ...selectedInventory,
            newQuantity: body.newQuantity,
            reason: body.reason,
            userId,
          })
          .returning({ id: stockAdjustments.id })
      )[0];

      if (!stockAdjustment?.id) {
        tx.rollback();
        throw new InternalError();
      }

      const updateInventory = (
        await tx
          .update(inventories)
          .set({ stock: body.newQuantity })
          .where(eq(inventories.id, inventoryId))
          .returning({ id: inventories.id })
      )[0];

      if (!updateInventory?.id) {
        throw new InternalError();
      }

      return stockAdjustment.id;
    });

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(`inventories:${inventoryId}`);

    return stockAdjustmentId;
  }

  static async deleteInventory(id: string) {
    const result = await db
      .update(inventories)
      .set({ deletedAt: sql`now()` })
      .where(eq(inventories.id, id))
      .returning({ id: inventories.id });

    if (!result.length) {
      throw new InternalError("Inventory id not valid");
    }

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(`inventories:${id}`);

    return result[0]?.id as string;
  }
}
