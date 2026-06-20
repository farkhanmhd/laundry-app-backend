import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { vouchers } from "@/db/schema/vouchers";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import type { Voucher, VoucherInsert, VouchersQuery } from "./model";

/**
 * Abstract class for handling voucher-related database operations.
 * This approach centralizes data logic and ensures consistency.
 */

export abstract class Vouchers {
  static async getVisibleVouchers() {
    try {
      const rows = await db
        .select({
          id: vouchers.id,
          code: vouchers.code,
          description: vouchers.description,
          discountPercentage: vouchers.discountPercentage,
          discountAmount: vouchers.discountAmount,
          minSpend: vouchers.minSpend,
          maxDiscountAmount: vouchers.maxDiscountAmount,
          expiresAt: vouchers.expiresAt,
        })
        .from(vouchers)
        .where(
          and(
            gt(vouchers.expiresAt, sql`now()`),
            eq(vouchers.isVisible, true),
            isNull(vouchers.deletedAt)
          )
        )
        .orderBy(desc(vouchers.createdAt));

      return rows;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  /**
   * Retrieves all active vouchers from the database, sorted by creation date.
   * Implements "soft delete" by filtering out vouchers where `isActive` is false.
   * @returns A promise that resolves to an array of active vouchers.
   */
  static async getActiveVouchers() {
    try {
      const rows = await db
        .select()
        .from(vouchers)
        .where(
          and(
            gt(vouchers.expiresAt, sql`now()`),
            eq(vouchers.isVisible, true),
            isNull(vouchers.deletedAt)
          )
        )
        .orderBy(desc(vouchers.createdAt));

      return rows;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  static async getAllVouchers(query: VouchersQuery) {
    try {
      const { search = "", rows = 50, page = 1, visibility, type } = query;

      const conditions: SQL[] = [isNull(vouchers.deletedAt)];

      if (visibility) {
        const visibilityValues: boolean[] = [];
        if (visibility.includes("true")) {
          visibilityValues.push(true);
        }
        if (visibility.includes("false")) {
          visibilityValues.push(false);
        }
        if (visibilityValues.length) {
          conditions.push(inArray(vouchers.isVisible, visibilityValues));
        }
      }

      if (type?.includes("percentage")) {
        conditions.push(isNotNull(vouchers.discountPercentage));
      }
      if (type?.includes("fixed")) {
        conditions.push(isNotNull(vouchers.discountAmount));
      }

      if (search) {
        const searchCondition = or(
          ilike(vouchers.code, `%${search}%`),
          ilike(vouchers.description, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const offset = (page - 1) * rows;

      const dataQuery = db
        .select()
        .from(vouchers)
        .where(and(...conditions))
        .limit(rows)
        .offset(offset)
        .orderBy(desc(vouchers.createdAt));

      const totalQuery = db
        .select({ count: count() })
        .from(vouchers)
        .where(and(...conditions));

      const [data, totalResult] = await Promise.all([dataQuery, totalQuery]);

      const totalData = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(totalData / rows);

      return { data, totalData, totalPages };
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new InternalError("Could not retrieve vouchers.");
    }
  }

  static async getVoucherById(id: string) {
    const { expiresAt, ...columns } = getTableColumns(vouchers);
    const row = await db
      .select({
        ...columns,
        expiresAt: sql<string>`${vouchers.expiresAt} + interval '7 hours'`,
      })
      .from(vouchers)
      .where(and(eq(vouchers.id, id), isNull(vouchers.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Inventory not found");
    }

    return row[0] as Voucher;
  }

  /**
   * Adds a new voucher to the database.
   * @param data - The data for the new voucher.
   * @returns A promise that resolves to the ID of the newly created voucher.
   * @throws {InternalError} If the voucher creation fails.
   */
  static async addVoucher(data: VoucherInsert) {
    const code = data.code.toLowerCase();
    const existing = await db
      .select({ id: vouchers.id })
      .from(vouchers)
      .where(and(eq(vouchers.code, code), isNull(vouchers.deletedAt)))
      .limit(1);

    if (existing.length) {
      throw new ConflictError("A voucher with this code already exists.");
    }

    try {
      const result = await db
        .insert(vouchers)
        .values({ ...data, code })
        .returning({ id: vouchers.id });

      if (!(result.length && result[0]?.id)) {
        throw new InternalError("Failed to create the new voucher.");
      }

      return result[0].id;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        throw new ConflictError("A voucher with this code already exists.");
      }
      throw error;
    }
  }

  /**
   * Updates an existing voucher by its ID.
   * @param id - The ID of the voucher to update.
   * @param data - The new data for the voucher.
   * @returns A promise that resolves to the ID of the updated voucher.
   * @throws {NotFoundError} If no voucher with the given ID is found.
   */
  static async updateVoucher(id: string, data: VoucherInsert) {
    if (data.code) {
      const code = data.code.toLowerCase();
      const existing = await db
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.code, code),
            isNull(vouchers.deletedAt),
            eq(vouchers.isVisible, true)
          )
        )
        .limit(1);

      if (existing.length && existing[0]?.id !== id) {
        throw new ConflictError("A voucher with this code already exists.");
      }
    }

    try {
      const result = await db
        .update(vouchers)
        .set(data)
        .where(eq(vouchers.id, id))
        .returning({ id: vouchers.id });

      if (!(result.length && result[0]?.id)) {
        throw new NotFoundError("Voucher not found.");
      }

      return result[0].id;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        throw new ConflictError("A voucher with this code already exists.");
      }
      throw error;
    }
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

    return result[0].id;
  }
}
