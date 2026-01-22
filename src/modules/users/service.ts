import { and, count, desc, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import type { SearchQuery } from "@/search-query";

export abstract class UserService {
  static async getUser(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;
    const searchByName = ilike(user.name, `%${search}%`);
    const searchByUsername = ilike(user.username, `%${search}%`);
    const searchByPhone = ilike(user.phoneNumber, `%${search}%`);

    const whereQuery = and(
      or(searchByUsername, searchByName, searchByPhone),
      ne(user.role, "superadmin")
    );
    const usersQuery = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        image: user.image,
        username: user.username,
        role: user.role,
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

    const [users, totalResult] = await Promise.all([usersQuery, totalQuery]);

    return { users, total: totalResult[0]?.count ?? 0 };
  }
}
