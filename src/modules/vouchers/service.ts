import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { vouchers } from "@/db/schema/vouchers";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type { Voucher, VoucherInsert } from "./model";

/**
 * Abstract class for handling voucher-related database operations.
 * This approach centralizes data logic and ensures consistency.
 */

const VOUCHER_CACHE_KEY = "voucher:all";

export abstract class Vouchers {
  /**
   * Retrieves all active vouchers from the database, sorted by creation date.
   * Implements "soft delete" by filtering out vouchers where `isActive` is false.
   * @returns A promise that resolves to an array of active vouchers.
   */
  static async getActiveVouchers() {
    try {
      const json = await redis.get(VOUCHER_CACHE_KEY);

      if (json) {
        return JSON.parse(json) as Voucher[];
      }

      const rows = await db
        .select()
        .from(vouchers)
        .where(
          and(gt(vouchers.expiresAt, sql`now()`), eq(vouchers.isVisible, true))
        )
        .orderBy(desc(vouchers.createdAt));

      await redis.set(VOUCHER_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

      return rows;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  static async getAllVouchers() {
    try {
      const rows = await db
        .select()
        .from(vouchers)
        .orderBy(desc(vouchers.createdAt));

      await redis.del(VOUCHER_CACHE_KEY);

      return rows;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  static async getVoucherById(id: string) {
    const cacheKey = `voucher:${id}`;
    const json = await redis.get(cacheKey);
    if (json) {
      return JSON.parse(json) as Voucher;
    }
    const row = await db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, id), isNull(vouchers.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

    await redis.set(cacheKey, JSON.stringify(row[0]), "EX", 3600);
    return row[0] as Voucher;
  }

  /**
   * Adds a new voucher to the database.
   * @param data - The data for the new voucher.
   * @returns A promise that resolves to the ID of the newly created voucher.
   * @throws {InternalError} If the voucher creation fails.
   */
  static async addVoucher(data: VoucherInsert) {
    const result = await db
      .insert(vouchers)
      .values({ ...data, code: data.code.toLowerCase() })
      .returning({ id: vouchers.id });

    if (!(result.length && result[0]?.id)) {
      throw new InternalError("Failed to create the new voucher.");
    }

    await redis.del(VOUCHER_CACHE_KEY);

    return result[0].id;
  }

  /**
   * Updates an existing voucher by its ID.
   * @param id - The ID of the voucher to update.
   * @param data - The new data for the voucher.
   * @returns A promise that resolves to the ID of the updated voucher.
   * @throws {NotFoundError} If no voucher with the given ID is found.
   */
  static async updateVoucher(id: string, data: VoucherInsert) {
    const result = await db
      .update(vouchers)
      .set(data)
      .where(eq(vouchers.id, id))
      .returning({ id: vouchers.id });

    if (!(result.length && result[0]?.id)) {
      throw new NotFoundError("Voucher not found.");
    }

    await redis.del(VOUCHER_CACHE_KEY);
    await redis.del(`voucher:${id}`);

    return result[0].id;
  }

  /**
   * Deactivates a voucher (soft delete) by setting its `isActive` flag to false.
   * This preserves the voucher in the database for historical purposes.
   * @param id - The ID of the voucher to deactivate.
   * @returns A promise that resolves to the ID of the deactivated voucher.
   * @throws {NotFoundError} If no voucher with the given ID is found.
   */
  static async deleteVoucher(id: string) {
    const result = await db
      .update(vouchers)
      .set({ isVisible: false })
      .where(eq(vouchers.id, id))
      .returning({ id: vouchers.id });

    if (!(result.length && result[0]?.id)) {
      throw new NotFoundError("Voucher not found.");
    }

    await redis.del(VOUCHER_CACHE_KEY);
    await redis.del(`voucher:${id}`);

    return result[0].id;
  }
}
