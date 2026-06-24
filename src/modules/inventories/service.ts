import { write } from "bun";
import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  between,
  count,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  gt,
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
import { bundlingItems } from "@/db/schema/bundling-items";
import { bundlings } from "@/db/schema/bundlings";
import { inventories } from "@/db/schema/inventories";
import { inventoryLogs } from "@/db/schema/inventory-logs";
import { restockLogs } from "@/db/schema/restock-logs";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import type { Transaction } from "@/utils";
import { computeChangedFields, logInventoryChange } from "./audit";
import type {
  AddInventoryBody,
  AdjustQuantitySchema,
  Inventory,
  InventoryHistoryQuery,
  InventoryLogsQuery,
  MovementHistoryEntry,
  MovementHistoryRow,
  RestockQuantitySchema,
  UpdateAdjustQuantitySchema,
  UpdateInventoryBody,
  UpdateInventoryImage,
  UpdateRestockQuantitySchema,
} from "./model";

function toMovementHistoryEntry(row: MovementHistoryRow): MovementHistoryEntry {
  return {
    id: row.id,
    inventoryId: row.inventory_id,
    inventoryName: row.inventory_name,
    type: row.type,
    changeAmount: row.change_amount,
    stockRemaining: row.stock_remaining,
    previousStock: row.previous_stock,
    reference: row.reference,
    note: row.note,
    actorName: row.actor_name,
    inputTime: row.input_time,
    createdAt: row.created_at,
    isLatest: row.is_latest,
  };
}

export abstract class Inventories {
  static async getInventories() {
    const whereConditions = [isNull(inventories.deletedAt)];

    const result = await db
      .select({
        ...getTableColumns(inventories),
        isOnBundling: sql<boolean>`COUNT(${bundlingItems.id}) > 0`,
      })
      .from(inventories)
      .leftJoin(bundlingItems, eq(bundlingItems.inventoryId, inventories.id))
      .leftJoin(
        bundlings,
        and(
          eq(bundlings.id, bundlingItems.bundlingId),
          isNull(bundlings.deletedAt)
        )
      )
      .where(and(...whereConditions))
      .groupBy(inventories.id);
    return result;
  }

  static async getAdjustmentHistory(query: InventoryHistoryQuery) {
    const {
      from,
      to,
      search = "",
      rows = 50,
      page = 1,
      inventoryIds = [],
    } = query;

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

    if (from && to) {
      const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
      const parsedTo = parse(to, "dd-MM-yyyy", new Date());
      const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
      const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");
      filters.push(between(adjustmentLogs.createdAt, startDate, endDate));
    }

    const whereQuery = and(...filters, isNull(adjustmentLogs.orderId));

    const inventoryHistoryQuery = db
      .select({
        id: adjustmentLogs.id,
        inventoryId: inventories.id,
        name: inventories.name,
        change: adjustmentLogs.changeAmount,
        note: adjustmentLogs.note,
        userId: adjustmentLogs.actorId,
        user: user.name,
        createdAt: adjustmentLogs.createdAt,
        isLatest: sql<boolean>`NOT EXISTS (
          SELECT 1 FROM adjustment_logs _al2
          WHERE _al2.inventory_id = ${adjustmentLogs.inventoryId}
          AND _al2.created_at > ${adjustmentLogs.createdAt}
        ) AND NOT EXISTS (
          SELECT 1 FROM restock_logs _rl2
          WHERE _rl2.inventory_id = ${adjustmentLogs.inventoryId}
          AND _rl2.created_at > ${adjustmentLogs.createdAt}
        )`,
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
    const {
      from,
      to,
      search = "",
      rows = 50,
      page = 1,
      inventoryIds = [],
    } = query;

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

    if (from && to) {
      const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
      const parsedTo = parse(to, "dd-MM-yyyy", new Date());
      const startDate = format(startOfDay(parsedFrom), "yyyy-MM-dd HH:mm:ss");
      const endDate = format(endOfDay(parsedTo), "yyyy-MM-dd HH:mm:ss");
      filters.push(between(adjustmentLogs.createdAt, startDate, endDate));
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
    const { rows = 50, page = 1, inventoryIds = [] } = query;

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
        supplier: restockLogs.supplier,
        restockPrice: restockLogs.restockPrice,
        note: restockLogs.note,
        userId: restockLogs.userId,
        actorName: user.name,
        restockTime: restockLogs.restockTime,
        createdAt: restockLogs.createdAt,
        isLatest: sql<boolean>`NOT EXISTS (
          SELECT 1 FROM adjustment_logs _al2
          WHERE _al2.inventory_id = ${restockLogs.inventoryId}
          AND _al2.created_at > ${restockLogs.createdAt}
        ) AND NOT EXISTS (
          SELECT 1 FROM restock_logs _rl2
          WHERE _rl2.inventory_id = ${restockLogs.inventoryId}
          AND _rl2.created_at > ${restockLogs.createdAt}
        )`,
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

  static async getMovementHistory(
    inventoryId: string,
    query: { page?: number; rows?: number }
  ) {
    const { rows = 50, page = 1 } = query;
    const result = await db.execute(sql`
      SELECT sq.*,
        row_number() OVER (ORDER BY sq.created_at DESC) = 1 AS is_latest
      FROM (
        SELECT
          rl.id, rl.inventory_id, i.name AS inventory_name,
          'restock' AS type, rl.restock_quantity AS change_amount,
          rl.stock_remaining,
          rl.stock_remaining - rl.restock_quantity AS previous_stock,
          rl.supplier AS reference, rl.note, u.name AS actor_name,
          rl.restock_time as input_time,
          rl.created_at
        FROM restock_logs rl
        LEFT JOIN inventories i ON i.id = rl.inventory_id
        LEFT JOIN "user" u ON u.id = rl.user_id
        WHERE rl.inventory_id = ${inventoryId}

        UNION ALL

        SELECT
          al.id, al.inventory_id, i.name,
          CASE WHEN al.order_id IS NOT NULL OR al.bundling_id IS NOT NULL THEN 'usage' ELSE 'adjustment' END,
          al.change_amount, al.stock_remaining,
          al.stock_remaining - al.change_amount,
          CASE WHEN al.order_id IS NOT NULL THEN al.order_id WHEN al.bundling_id IS NOT NULL THEN al.bundling_id END,
          al.note, u.name, al.adjustment_time as input_time, al.created_at
        FROM adjustment_logs al
        LEFT JOIN inventories i ON i.id = al.inventory_id
        LEFT JOIN "user" u ON u.id = al.actor_id
        WHERE al.inventory_id = ${inventoryId}
      ) sq
      ORDER BY sq.created_at DESC
      LIMIT ${rows}
      OFFSET ${(page - 1) * rows}
    `);

    const rawRows = result.rows as MovementHistoryRow[];

    const rawCount = await db.execute(sql`
      SELECT count(*) AS cnt FROM (
        SELECT id FROM restock_logs WHERE inventory_id = ${inventoryId}
        UNION ALL
        SELECT id FROM adjustment_logs WHERE inventory_id = ${inventoryId}
      ) sub
    `);

    const countResult = rawCount.rows as { cnt: number }[];

    const total = Number(countResult[0]?.cnt ?? 0);
    const movementHistory = rawRows.map(toMovementHistoryEntry);

    return { total, movementHistory };
  }

  static async getInventoryOptions() {
    const options = await db
      .selectDistinct({
        value: inventories.id,
        label: inventories.name,
      })
      .from(inventories)
      .where(isNull(inventories.deletedAt));

    return options;
  }

  static async addInventory(actorId: string, formData: AddInventoryBody) {
    const { image, ...rest } = formData;
    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;
    await write(fullPath, image);
    const result = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(inventories)
        .values({
          image: imageUrl,
          ...rest,
        })
        .returning();
      if (inserted.length === 0 || !inserted[0]) {
        throw new InternalError();
      }
      await logInventoryChange(
        tx,
        inserted[0].id,
        actorId,
        "create",
        null,
        "Created inventory"
      );
      return inserted[0];
    });
    return { ...result, isOnBundling: false };
  }

  static async getInventoryById(id: string) {
    const row = await db
      .select({
        ...getTableColumns(inventories),
        isOnBundling: sql<boolean>`(SELECT count(*) > 0 FROM ${bundlingItems}
          WHERE ${bundlingItems.inventoryId} = ${inventories.id}
        )`.as("is_on_bundling"),
      })
      .from(inventories)
      .where(and(eq(inventories.id, id), isNull(inventories.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

    return row[0] as Inventory;
  }

  static async updateInventory(
    id: string,
    actorId: string,
    data: UpdateInventoryBody
  ) {
    return await db.transaction(async (tx) => {
      const [old] = await tx
        .select()
        .from(inventories)
        .where(eq(inventories.id, id))
        .limit(1);
      if (!old) {
        throw new NotFoundError("Inventory not found");
      }

      await tx
        .update(inventories)
        .set({ ...data, updatedAt: sql`now()` })
        .where(eq(inventories.id, id));

      const changed = computeChangedFields(old, data);
      if (Object.keys(changed).length > 0) {
        const summary = `Updated ${Object.keys(changed).join(", ")}`;
        await logInventoryChange(tx, id, actorId, "update", changed, summary);
      }

      return id;
    });
  }

  static async updateInventoryImage(
    id: string,
    actorId: string,
    data: UpdateInventoryImage
  ) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: inventories.id })
        .from(inventories)
        .where(eq(inventories.id, id))
        .limit(1);
      if (!existing) {
        throw new NotFoundError("Inventory not found");
      }

      await tx
        .update(inventories)
        .set({ image: imageUrl })
        .where(eq(inventories.id, id));

      await logInventoryChange(
        tx,
        id,
        actorId,
        "image_update",
        null,
        "Updated image"
      );

      return id;
    });
  }

  private static async isLatestMovement(
    tx: Transaction,
    inventoryId: string,
    createdAt: string
  ): Promise<boolean> {
    const laterAdjustment = await tx
      .select({ id: adjustmentLogs.id })
      .from(adjustmentLogs)
      .where(
        and(
          eq(adjustmentLogs.inventoryId, inventoryId),
          gt(adjustmentLogs.createdAt, createdAt)
        )
      )
      .limit(1);

    if (laterAdjustment.length) {
      return false;
    }

    const laterRestock = await tx
      .select({ id: restockLogs.id })
      .from(restockLogs)
      .where(
        and(
          eq(restockLogs.inventoryId, inventoryId),
          gt(restockLogs.createdAt, createdAt)
        )
      )
      .limit(1);

    return laterRestock.length === 0;
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

    return stockLogId;
  }

  static async restockInventory(
    userId: string,
    inventoryId: string,
    body: RestockQuantitySchema
  ) {
    const restockLogId = await db.transaction(async (tx) => {
      const [oldInventory] = await tx
        .select({ price: inventories.price })
        .from(inventories)
        .where(eq(inventories.id, inventoryId))
        .limit(1);

      if (!oldInventory) {
        throw new NotFoundError("Inventory Id not found");
      }

      const [updatedInventory] = await tx
        .update(inventories)
        .set({
          stock: sql`${inventories.stock} + ${body.restockQuantity}`,
          ...(body.price != null ? { price: body.price } : {}),
        })
        .where(eq(inventories.id, inventoryId))
        .returning({ stock: inventories.stock });

      if (!updatedInventory) {
        throw new InternalError();
      }

      if (body.price != null && oldInventory.price !== body.price) {
        const changed = { price: { old: oldInventory.price, new: body.price } };
        await logInventoryChange(
          tx,
          inventoryId,
          userId,
          "update",
          changed,
          "Updated price"
        );
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
            restockPrice: body.restockPrice,
          })
          .returning({ id: restockLogs.id })
      )[0];

      if (!restockLogQuery?.id) {
        tx.rollback();
        throw new InternalError();
      }

      return restockLogQuery.id;
    });

    return restockLogId;
  }

  static async deleteInventory(id: string, actorId: string) {
    const bundling = await db
      .select({ id: bundlingItems.id })
      .from(bundlingItems)
      .where(eq(bundlingItems.inventoryId, id));

    if (bundling.length) {
      throw new ConflictError("Inventory is being used in a bundling");
    }

    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: inventories.id })
        .from(inventories)
        .where(eq(inventories.id, id))
        .limit(1);
      if (!existing) {
        throw new NotFoundError("Inventory id not valid");
      }

      await tx
        .update(inventories)
        .set({ deletedAt: sql`now()` })
        .where(eq(inventories.id, id));

      await logInventoryChange(
        tx,
        id,
        actorId,
        "delete",
        null,
        "Deleted inventory"
      );

      return id;
    });
  }

  static async getInventoryLogs(
    inventoryId: string,
    query: InventoryLogsQuery
  ) {
    const { rows = 50, page = 1 } = query;

    const logs = await db
      .select({
        ...getTableColumns(inventoryLogs),
        actor: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      })
      .from(inventoryLogs)
      .leftJoin(user, eq(inventoryLogs.actorId, user.id))
      .where(eq(inventoryLogs.inventoryId, inventoryId))
      .orderBy(desc(inventoryLogs.createdAt))
      .limit(rows)
      .offset((page - 1) * rows);

    const [totalResult] = await db
      .select({ count: count() })
      .from(inventoryLogs)
      .where(eq(inventoryLogs.inventoryId, inventoryId));

    return { logs, total: totalResult?.count ?? 0 };
  }

  static async updateAdjustment(id: string, body: UpdateAdjustQuantitySchema) {
    await db.transaction(async (tx) => {
      const [log] = await tx
        .select()
        .from(adjustmentLogs)
        .where(eq(adjustmentLogs.id, id))
        .for("update")
        .limit(1);

      if (!log) {
        throw new NotFoundError("Adjustment log not found");
      }

      const isLatest = await Inventories.isLatestMovement(
        tx,
        log.inventoryId,
        log.createdAt
      );

      if (!isLatest) {
        throw new ConflictError(
          "Tidak dapat diubah, sudah ada pergerakan stok berikutnya untuk item ini"
        );
      }

      const [inventory] = await tx
        .select({ stock: inventories.stock })
        .from(inventories)
        .where(eq(inventories.id, log.inventoryId))
        .for("update")
        .limit(1);

      if (!inventory) {
        throw new NotFoundError("Inventory not found");
      }

      const newStock = inventory.stock - log.changeAmount + body.changeAmount;

      if (newStock < 0) {
        throw new ConflictError("Stok tidak boleh negatif setelah perubahan");
      }

      await tx
        .update(adjustmentLogs)
        .set({
          updatedAt: sql`now()`,
          changeAmount: body.changeAmount,
          stockRemaining: newStock,
          ...(body.note !== undefined && { note: body.note }),
        })
        .where(eq(adjustmentLogs.id, id));

      await tx
        .update(inventories)
        .set({ stock: newStock, updatedAt: sql`now()` })
        .where(eq(inventories.id, log.inventoryId));
    });
  }

  static async deleteAdjustment(id: string) {
    await db.transaction(async (tx) => {
      const [log] = await tx
        .select()
        .from(adjustmentLogs)
        .where(eq(adjustmentLogs.id, id))
        .for("update")
        .limit(1);

      if (!log) {
        throw new NotFoundError("Adjustment log not found");
      }

      const isLatest = await Inventories.isLatestMovement(
        tx,
        log.inventoryId,
        log.createdAt
      );

      if (!isLatest) {
        throw new ConflictError(
          "Tidak dapat dihapus, sudah ada pergerakan stok berikutnya untuk item ini"
        );
      }

      const baseline = log.stockRemaining - log.changeAmount;

      await tx.delete(adjustmentLogs).where(eq(adjustmentLogs.id, id));

      const [updatedInventory] = await tx
        .update(inventories)
        .set({ stock: baseline, updatedAt: sql`now()` })
        .where(eq(inventories.id, log.inventoryId))
        .returning({ id: inventories.id });

      if (!updatedInventory) {
        tx.rollback();
        throw new InternalError();
      }
    });
  }

  static async updateRestockLog(id: string, body: UpdateRestockQuantitySchema) {
    await db.transaction(async (tx) => {
      const [log] = await tx
        .select()
        .from(restockLogs)
        .where(eq(restockLogs.id, id))
        .for("update")
        .limit(1);

      if (!log) {
        throw new NotFoundError("Restock log not found");
      }

      const isLatest = await Inventories.isLatestMovement(
        tx,
        log.inventoryId,
        log.createdAt
      );

      if (!isLatest) {
        throw new ConflictError(
          "Failed to update restock log: not the latest movement"
        );
      }

      const [inventory] = await tx
        .select({ stock: inventories.stock })
        .from(inventories)
        .where(eq(inventories.id, log.inventoryId))
        .for("update")
        .limit(1);

      if (!inventory) {
        throw new NotFoundError("Inventory not found");
      }

      const newStock =
        inventory.stock - log.restockQuantity + body.restockQuantity;

      if (newStock < 0) {
        throw new ConflictError("Stok tidak boleh negatif setelah perubahan");
      }

      await tx
        .update(restockLogs)
        .set({
          updatedAt: sql`now()`,
          restockQuantity: body.restockQuantity,
          stockRemaining: newStock,
          ...(body.note !== undefined && { note: body.note }),
        })
        .where(eq(restockLogs.id, id));

      await tx
        .update(inventories)
        .set({ stock: newStock, updatedAt: sql`now()` })
        .where(eq(inventories.id, log.inventoryId));
    });
  }

  static async deleteRestockLog(id: string) {
    await db.transaction(async (tx) => {
      const [log] = await tx
        .select()
        .from(restockLogs)
        .where(eq(restockLogs.id, id))
        .for("update")
        .limit(1);

      if (!log) {
        throw new NotFoundError("Restock log not found");
      }

      const isLatest = await Inventories.isLatestMovement(
        tx,
        log.inventoryId,
        log.createdAt
      );

      if (!isLatest) {
        throw new ConflictError(
          "Tidak dapat dihapus, sudah ada pergerakan stok berikutnya untuk item ini"
        );
      }

      const baseline = log.stockRemaining - log.restockQuantity;

      await tx.delete(restockLogs).where(eq(restockLogs.id, id));

      const [updatedInventory] = await tx
        .update(inventories)
        .set({ stock: baseline, updatedAt: sql`now()` })
        .where(eq(inventories.id, log.inventoryId))
        .returning({ id: inventories.id });

      if (!updatedInventory) {
        tx.rollback();
        throw new InternalError();
      }
    });
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
    const result = await db
      .select({ count: count() })
      .from(inventories)
      .where(isNull(inventories.deletedAt));
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
      .where(
        and(
          lt(inventories.stock, inventories.safetyStock),
          isNull(inventories.deletedAt)
        )
      );
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
