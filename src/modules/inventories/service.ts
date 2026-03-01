import { write } from "bun";
import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { adjustmentLogs } from "@/db/schema/adjustment-logs";
import { user } from "@/db/schema/auth";
import { inventories } from "@/db/schema/inventories";
import { restockLogs } from "@/db/schema/restock-logs";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import { BUNDLINGS_CACHE_KEY } from "../bundlings/service";
import { POS_CACHE_KEY } from "../pos/service";
import type {
  AddInventoryBody,
  AdjustQuantitySchema,
  Inventory,
  InventoryHistoryQuery,
  RestockQuantitySchema,
  UpdateInventoryBody,
  UpdateInventoryImage,
} from "./model";
export const INVENTORIES_CACHE_KEY = "inventories:all";
const TOTAL_INVENTORIES = "inventories:total";

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

  static async getAdjustmentHistory(query: InventoryHistoryQuery) {
    const { search = "", rows = 10, page = 1, inventoryIds = [] } = query;

    const filters: SQL[] = [];

    const searchByInventoryId = inArray(inventories.id, inventoryIds);

    if (inventoryIds.length > 0) {
      filters.push(searchByInventoryId);
    }

    const searchByName = ilike(inventories.name, `%${search}%`);
    const searchByOrderId = ilike(adjustmentLogs.orderId, `%${search}%`);

    if (search) {
      const searchGroup = or(searchByName, searchByOrderId);
      if (searchGroup) {
        filters.push(searchGroup);
      }
    }

    const whereQuery = and(...filters, isNull(adjustmentLogs.orderId));

    const inventoryHistoryQuery = db
      .select({
        id: adjustmentLogs.id,
        inventoryId: inventories.id,
        name: inventories.name,
        change: adjustmentLogs.changeAmount,
        stockRemaining: adjustmentLogs.stockRemaining,
        note: adjustmentLogs.note,
        userId: adjustmentLogs.actorId,
        user: user.name,
        createdAt: adjustmentLogs.createdAt,
      })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(adjustmentLogs.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id));

    const [inventoryHistory, [total]] = await Promise.all([
      inventoryHistoryQuery,
      totalQuery,
    ]);
    return {
      total: total?.count ?? 0,
      inventoryHistory,
    };
  }

  static async getUsageHistory(query: InventoryHistoryQuery) {
    const { search = "", rows = 10, page = 1, inventoryIds = [] } = query;

    const filters: SQL[] = [];

    const searchByInventoryId = inArray(inventories.id, inventoryIds);

    if (inventoryIds.length > 0) {
      filters.push(searchByInventoryId);
    }

    const searchByName = ilike(inventories.name, `%${search}%`);
    const searchByOrderId = ilike(adjustmentLogs.orderId, `%${search}%`);

    if (search) {
      const searchGroup = or(searchByName, searchByOrderId);
      if (searchGroup) {
        filters.push(searchGroup);
      }
    }

    const whereQuery = and(...filters, isNotNull(adjustmentLogs.orderId));

    const usageHistory = db
      .select({
        id: adjustmentLogs.id,
        inventoryId: inventories.id,
        orderId: adjustmentLogs.orderId,
        name: inventories.name,
        change: adjustmentLogs.changeAmount,
        user: user.name,
        stockRemaining: adjustmentLogs.stockRemaining,
        createdAt: adjustmentLogs.createdAt,
      })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(adjustmentLogs.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(adjustmentLogs)
      .leftJoin(inventories, eq(adjustmentLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(adjustmentLogs.actorId, user.id))
      .where(whereQuery);

    const [inventoryUsageHistory, [total]] = await Promise.all([
      usageHistory,
      totalQuery,
    ]);
    return {
      total: total?.count ?? 0,
      inventoryUsageHistory,
    };
  }

  static async getRestockHistory(query: InventoryHistoryQuery) {
    const { rows = 10, page = 1, inventoryIds = [] } = query;

    const filters: SQL[] = [];

    const searchByInventoryId = inArray(inventories.id, inventoryIds);

    if (inventoryIds.length > 0) {
      filters.push(searchByInventoryId);
    }

    const restockHistoryQuery = db
      .select({
        id: restockLogs.id,
        inventoryId: restockLogs.inventoryId,
        inventoryName: inventories.name,
        restockQuantity: restockLogs.restockQuantity,
        stockRemaining: restockLogs.stockRemaining,
        supplier: restockLogs.supplier,
        note: restockLogs.note,
        userId: restockLogs.userId,
        actorName: user.name,
        restockTime: restockLogs.restockTime,
        createdAt: restockLogs.createdAt,
      })
      .from(restockLogs)
      .leftJoin(inventories, eq(restockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(restockLogs.userId, user.id))
      .where(and(...filters))
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(restockLogs.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(restockLogs)
      .leftJoin(inventories, eq(restockLogs.inventoryId, inventories.id))
      .leftJoin(user, eq(restockLogs.userId, user.id))
      .where(and(...filters));

    const [restockHistory, [total]] = await Promise.all([
      restockHistoryQuery,
      totalQuery,
    ]);
    return {
      total: total?.count ?? 0,
      restockHistory,
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
    await redis.del(TOTAL_INVENTORIES);
    await redis.del(POS_CACHE_KEY);
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
    await redis.del(POS_CACHE_KEY);
    await redis.del(BUNDLINGS_CACHE_KEY);

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
          .insert(adjustmentLogs)
          .values({
            ...body,
            inventoryId,
            actorId: userId,
            stockRemaining: updatedInventory.stock,
          })
          .returning({ id: adjustmentLogs.id })
      )[0];

      if (!stockLogQuery?.id) {
        tx.rollback();
        throw new InternalError();
      }

      return stockLogQuery.id;
    });

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(POS_CACHE_KEY);

    return stockLogId;
  }

  static async restockInventory(
    userId: string,
    inventoryId: string,
    body: RestockQuantitySchema
  ) {
    const restockLogId = await db.transaction(async (tx) => {
      const [updatedInventory] = await tx
        .update(inventories)
        .set({
          stock: sql`${inventories.stock} + ${body.restockQuantity}`,
        })
        .where(eq(inventories.id, inventoryId))
        .returning({ stock: inventories.stock });

      if (!updatedInventory) {
        throw new NotFoundError("Inventory Id not found");
      }

      const restockLogQuery = (
        await tx
          .insert(restockLogs)
          .values({
            inventoryId,
            supplier: body.supplier,
            stockRemaining: updatedInventory.stock,
            restockQuantity: body.restockQuantity,
            note: body.note,
            userId,
            restockTime: body.restockTime,
          })
          .returning({ id: restockLogs.id })
      )[0];

      if (!restockLogQuery?.id) {
        tx.rollback();
        throw new InternalError();
      }

      return restockLogQuery.id;
    });

    await redis.del(INVENTORIES_CACHE_KEY);
    await redis.del(POS_CACHE_KEY);

    return restockLogId;
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
    await redis.del(TOTAL_INVENTORIES);
    await redis.del(POS_CACHE_KEY);

    return result[0]?.id as string;
  }

  private static getDateFilter(from: string, to: string) {
    // Parse dates for filtering
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());
    const startDate = startOfDay(parsedFrom);
    const endDate = endOfDay(parsedTo);
    const startString = format(startDate, "yyyy-MM-dd HH:mm:ss");
    const endString = format(endDate, "yyyy-MM-dd HH:mm:ss");

    // Create base date filter condition
    return sql`${adjustmentLogs.createdAt} BETWEEN ${startString} AND ${endString}`;
  }

  static async getTotalItems(): Promise<number> {
    const json = await redis.get(TOTAL_INVENTORIES);
    if (json) {
      return JSON.parse(json);
    }

    const result = await db.select({ count: count() }).from(inventories);
    await redis.set(TOTAL_INVENTORIES, JSON.stringify(result[0]?.count ?? 0));
    return result[0]?.count ?? 0;
  }

  static async getLowStockItems() {
    const result = await db
      .select({
        id: inventories.id,
        name: inventories.name,
        stock: inventories.stock,
      })
      .from(inventories)
      .where(lt(inventories.stock, inventories.safetyStock));
    return result;
  }

  static async getTotalUsage(from: string, to: string): Promise<number> {
    const dateFilter = Inventories.getDateFilter(from, to);
    const result = await db
      .select({
        totalUsage: sql<number>`sum(abs(${adjustmentLogs.changeAmount}))`.as(
          "totalUsage"
        ),
      })
      .from(adjustmentLogs)
      .where(dateFilter);
    return result[0]?.totalUsage ?? 0;
  }

  static async getUniqueOrderCount(from: string, to: string): Promise<number> {
    const dateFilter = Inventories.getDateFilter(from, to);
    const result = await db
      .select({ count: countDistinct(adjustmentLogs.orderId) })
      .from(adjustmentLogs)
      .where(dateFilter);
    return result[0]?.count ?? 0;
  }
}
