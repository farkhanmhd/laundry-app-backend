import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import type { SearchQuery } from "@/search-query";

export abstract class DriverService {
  static async getDrivers(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;

    const searchByName = ilike(user.name, `%${search}%`);
    const searchByUsername = ilike(user.username, `%${search}%`);
    const searchByPhone = ilike(user.phoneNumber, `%${search}%`);

    const whereQuery = and(
      eq(user.role, "driver"),
      or(searchByName, searchByUsername, searchByPhone)
    );

    const driversQuery = db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(user.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(user)
      .where(whereQuery);

    const [drivers, totalResult] = await Promise.all([
      driversQuery,
      totalQuery,
    ]);

    return { drivers, total: totalResult[0]?.count ?? 0 };
  }
}
