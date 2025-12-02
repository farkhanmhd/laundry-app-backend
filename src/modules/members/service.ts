import { count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { members as membersTable } from "@/db/schema/members";
import { InternalError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";
import type { AddMemberBody } from "./model";

export abstract class Members {
  static async getMembers(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;
    const searchById = ilike(membersTable.id, `%${search}%`);
    const searchByName = ilike(membersTable.name, `%${search}%`);
    const searchByPhone = ilike(membersTable.phone, `%${search}%`);

    const whereQuery = or(searchById, searchByName, searchByPhone);

    const membersQuery = db
      .select()
      .from(membersTable)
      .where(whereQuery)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(membersTable.createdAt));

    const totalQuery = db
      .select({ count: count() })
      .from(membersTable)
      .where(whereQuery);

    const [members, totalResult] = await Promise.all([
      membersQuery,
      totalQuery,
    ]);

    return { members, total: totalResult[0]?.count ?? 0 };
  }

  static async addMember(data: AddMemberBody) {
    const result = await db
      .insert(membersTable)
      .values({
        ...data,
        phone: `+62${data.phone}`
      })
      .returning({ id: membersTable.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }
}
