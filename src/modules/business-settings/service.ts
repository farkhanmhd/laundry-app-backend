import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings } from "@/db/schema/business-settings";
import { InternalError, NotFoundError } from "@/exceptions";
import type {
  CreateBusinessSettingsSchema,
  UpdateBusinessSettingsSchema,
} from "./model";

export abstract class BusinessSettingsService {
  static async get() {
    const [result] = await db.select().from(businessSettings).limit(1);

    if (!result) {
      throw new NotFoundError("Business settings not found");
    }

    return result;
  }

  static async upsert(
    body: CreateBusinessSettingsSchema | UpdateBusinessSettingsSchema
  ) {
    const existing = await db
      .select({ id: businessSettings.id })
      .from(businessSettings)
      .limit(1);

    const values = {
      ...body,
      updatedAt: sql`now()`,
    };

    if (existing.length > 0) {
      const [result] = await db
        .update(businessSettings)
        .set(values)
        .where(eq(businessSettings.id, existing[0].id))
        .returning();

      if (!result) {
        throw new InternalError("Failed to update business settings");
      }

      return result;
    }

    const [result] = await db
      .insert(businessSettings)
      .values(values as CreateBusinessSettingsSchema)
      .returning();

    if (!result) {
      throw new InternalError("Failed to create business settings");
    }

    return result;
  }
}
