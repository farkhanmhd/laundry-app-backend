import { write } from "bun";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { inventories } from "@/db/schema/inventories";
import { stockLogs } from "@/db/schema/stock-logs";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type {
  AddInventoryBody,
  AdjustQuantitySchema,
  Inventory,
  InventoryHistoryQuery,
  UpdateInventoryBody,
  UpdateInventoryImage,
} from "./model";

export const INVENTORIES_CACHE_KEY = "inventories:all";

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

  static async getInventoryHistory(query: InventoryHistoryQuery) {
    const {
      search = "",
      rows = 50,
      page = 1,
      category = [],
      inventoryIds = [],
    } = query;

    const filters: SQL[] = [];

    const searchByInventoryId = inArray(inventories.id, inventoryIds);
    const searchByCategory = inArray(stockLogs.type, category);

    if (inventoryIds.length > 0) {
      filters.push(searchByInventoryId);
    }

    if (category.length > 0) {
      filters.push(searchByCategory);
    }

    const searchByName = ilike(inventories.name, `%${search}%`);
    const searchByOrderId = ilike(stockLogs.orderId, `%${search}%`);

    if (search) {
      const searchGroup = or(searchByName, searchByOrderId);
      if (searchGroup) {
        filters.push(searchGroup);
      }
    }

    const whereQuery = and(...filters);

    const inventoryHistoryQuery = db
      .select({
        id: stockLogs.id,
        inventoryId: inventories.id,
        image: inventories.image,
        name: inventories.name,
        category: stockLogs.type,
        change: stockLogs.changeAmount,
        stockRemaining: stockLogs.stockRemaining,
        orderId: stockLogs.orderId,
        note: stockLogs.note,
        userId: stockLogs.actorId,
        user: user.name,
        createdAt: stockLogs.createdAt,
      })
      .from(stockLogs)
      .leftJoin(inventories, eq(stockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(stockLogs.actorId, user.id))
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(stockLogs.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(stockLogs)
      .leftJoin(inventories, eq(stockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(stockLogs.actorId, user.id))
      .where(whereQuery);

    const [inventoryHistory, [total]] = await Promise.all([
      inventoryHistoryQuery,
      totalQuery,
    ]);
    return {
      total: total?.count ?? 0,
      inventoryHistory,
    };
  }

  static async getInventoryOptions() {
    const options = await db
      .selectDistinct({
        value: inventories.id,
        label: inventories.name,
      })
      .from(inventories);

    return options;
  }

  static async addInventory(formData: AddInventoryBody) {
    const { image, ...rest } = formData;
    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;
    await write(fullPath, image);
    const result = await db
      .insert(inventories)
      .values({
        image: imageUrl,
        ...rest,
      })
      .returning(); // return all columns
    if (result.length === 0) {
      throw new InternalError();
    }
    const row = result[0];
    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.set(`inventories:${row?.id}`, JSON.stringify(row), "EX", 3600);
    return row;
  }

  static async getInventoryById(id: string) {
    const row = await db
      .select()
      .from(inventories)
      .where(and(eq(inventories.id, id), isNull(inventories.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

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

    return result[0]?.id as string;
  }

  static async adjustQuantity(
    userId: string,
    inventoryId: string,
    body: AdjustQuantitySchema
  ) {
    const stockLogId = await db.transaction(async (tx) => {
      const [updatedInventory] = await tx
        .update(inventories)
        .set({
          stock: sql`${inventories.stock} + ${body.changeAmount}`,
        })
        .where(eq(inventories.id, inventoryId))
        .returning({ stock: inventories.stock });

      if (!updatedInventory) {
        throw new NotFoundError("Inventory Id not found");
      }

      const stockLogQuery = (
        await tx
          .insert(stockLogs)
          .values({
            ...body,
            inventoryId,
            actorId: userId,
            stockRemaining: updatedInventory.stock,
          })
          .returning({ id: stockLogs.id })
      )[0];

      if (!stockLogQuery?.id) {
        tx.rollback();
        throw new InternalError();
      }

      return stockLogQuery.id;
    });

    await redis.del(INVENTORIES_CACHE_KEY);

    return stockLogId;
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

    return result[0]?.id as string;
  }
}
