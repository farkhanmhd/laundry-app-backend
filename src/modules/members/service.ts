import { count, ilike, or } from "drizzle-orm";
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

    const result = await db.transaction(async (tx) => {
      const total = (
        await tx.select({ count: count() }).from(membersTable).where(whereQuery)
      )[0]?.count;
      const members = await tx
        .select()
        .from(membersTable)
        .where(whereQuery)
        .limit(rows)
        .offset((page - 1) * rows);

      return { total, members };
    });

    return result;
  }

  static async addMember(data: AddMemberBody) {
    const result = await db
      .insert(membersTable)
      .values(data)
      .returning({ id: membersTable.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }
}
