import { and, eq, gt, lt, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { weightRanges } from "@/db/schema/weight-ranges";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import type { CreateWeightRangeSchema, UpdateWeightRangeSchema } from "./model";

export abstract class WeightRangeService {
  static async getAll() {
    try {
      return await db
        .select()
        .from(weightRanges)
        .where(eq(weightRanges.isActive, true))
        .orderBy(weightRanges.minWeight);
    } catch (error) {
      console.error("Error fetching weight ranges:", error);
      throw new InternalError("Could not retrieve weight ranges.");
    }
  }

  static async create(data: CreateWeightRangeSchema) {
    const { label, minWeight, maxWeight } = data;

    if (minWeight >= maxWeight) {
      throw new InternalError("minWeight must be less than maxWeight");
    }

    await WeightRangeService.checkOverlap(minWeight, maxWeight);

    try {
      const [result] = await db
        .insert(weightRanges)
        .values({
          label,
          minWeight: String(minWeight),
          maxWeight: String(maxWeight),
        })
        .returning({ id: weightRanges.id });

      if (!result) {
        throw new InternalError("Failed to create weight range.");
      }

      return result.id;
    } catch (error) {
      if (error instanceof InternalError || error instanceof ConflictError) {
        throw error;
      }
      console.error("Error creating weight range:", error);
      throw new InternalError("Failed to create weight range.");
    }
  }

  static async update(id: number, data: UpdateWeightRangeSchema) {
    const existing = await db
      .select()
      .from(weightRanges)
      .where(eq(weightRanges.id, id))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundError("Weight range not found");
    }

    const minWeight = data.minWeight ?? Number(existing[0].minWeight);
    const maxWeight = data.maxWeight ?? Number(existing[0].maxWeight);

    if (minWeight >= maxWeight) {
      throw new InternalError("minWeight must be less than maxWeight");
    }

    if (data.minWeight !== undefined || data.maxWeight !== undefined) {
      await WeightRangeService.checkOverlap(minWeight, maxWeight, id);
    }

    const updateData: Record<string, string | boolean | number> = {};
    if (data.label !== undefined) {
      updateData.label = data.label;
    }
    if (data.minWeight !== undefined) {
      updateData.minWeight = String(data.minWeight);
    }
    if (data.maxWeight !== undefined) {
      updateData.maxWeight = String(data.maxWeight);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    try {
      const [result] = await db
        .update(weightRanges)
        .set(updateData)
        .where(eq(weightRanges.id, id))
        .returning({ id: weightRanges.id });

      if (!result) {
        throw new NotFoundError("Weight range not found");
      }

      return result.id;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof InternalError
      ) {
        throw error;
      }
      console.error("Error updating weight range:", error);
      throw new InternalError("Failed to update weight range.");
    }
  }

  private static async checkOverlap(
    minWeight: number,
    maxWeight: number,
    excludeId?: number
  ) {
    const conditions = [
      and(
        lt(weightRanges.minWeight, String(maxWeight)),
        gt(weightRanges.maxWeight, String(minWeight))
      ),
      eq(weightRanges.isActive, true),
    ];

    if (excludeId !== undefined) {
      conditions.push(neq(weightRanges.id, excludeId));
    }

    const overlapping = await db
      .select({ id: weightRanges.id })
      .from(weightRanges)
      .where(and(...conditions))
      .limit(1);

    if (overlapping[0]) {
      throw new ConflictError(
        "Weight range overlaps with an existing active range"
      );
    }
  }
}

function neq(column: PgColumn, value: number) {
  return sql`${column} != ${value}`;
}
