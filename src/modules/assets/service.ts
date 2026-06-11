import { and, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import { InternalError, NotFoundError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";
import type { CreateAssetSchema, UpdateAssetSchema } from "./model";

export abstract class AssetService {
  static async getAssets(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;

    const searchByName = ilike(assets.name, `%${search}%`);
    const searchByPlate = ilike(assets.licensePlate, `%${search}%`);

    const whereQuery = and(
      isNull(assets.deletedAt),
      or(searchByName, searchByPlate)
    );

    const assetsQuery = db
      .select({
        id: assets.id,
        name: assets.name,
        licensePlate: assets.licensePlate,
      })
      .from(assets)
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(assets.name));

    const totalQuery = db
      .select({ count: count() })
      .from(assets)
      .where(whereQuery);

    const [assetList, totalResult] = await Promise.all([
      assetsQuery,
      totalQuery,
    ]);

    return { assets: assetList, total: totalResult[0]?.count ?? 0 };
  }

  static async createAsset(body: CreateAssetSchema) {
    const [result] = await db.insert(assets).values(body).returning({
      id: assets.id,
      name: assets.name,
      licensePlate: assets.licensePlate,
    });

    if (!result) {
      throw new InternalError("Failed to create asset");
    }

    return result;
  }

  static async updateAsset(id: string, body: UpdateAssetSchema) {
    const [result] = await db
      .update(assets)
      .set(body)
      .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
      .returning({ id: assets.id });

    if (!result) {
      throw new NotFoundError("Asset not found");
    }

    return result;
  }

  static async deleteAsset(id: string) {
    const [result] = await db
      .update(assets)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
      .returning({ id: assets.id });

    if (!result) {
      throw new NotFoundError("Asset not found");
    }

    return result.id;
  }
}
