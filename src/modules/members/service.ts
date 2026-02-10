import { endOfDay, format, parse, startOfDay } from "date-fns";
import {
  and,
  between,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/db";
import { members as membersTable } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
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
        phone: `+62${data.phone}`,
      })
      .returning({ id: membersTable.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  /**
   * Helper: Base condition ensures we only look at completed orders within the date range.
   */
  private static getBaseConditions(from: string, to: string) {
    // 1. Parse "20-01-2026" to Date objects
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());

    // 2. Get the full start and end of the day (still Date objects)
    const startDate = startOfDay(parsedFrom);
    const endDate = endOfDay(parsedTo);

    // 3. Format them as strings so Drizzle accepts them
    const startString = format(startDate, "yyyy-MM-dd HH:mm:ss");
    const endString = format(endDate, "yyyy-MM-dd HH:mm:ss");

    return and(
      between(orders.createdAt, startString, endString),
      inArray(orders.status, ["processing", "ready", "completed"])
    );
  }

  /**
   * Get total count of all members
   */
  static async getTotalCustomers() {
    const result = await db.select({ count: count() }).from(membersTable);

    return result[0]?.count ?? 0;
  }

  /**
   * Get count of active members within date range
   */
  static async getActiveMembers(from: string, to: string) {
    const result = await db
      .selectDistinct({
        memberId: membersTable.id,
      })
      .from(orders)
      .innerJoin(membersTable, eq(orders.memberId, membersTable.id))
      .where(Members.getBaseConditions(from, to));

    return result.length;
  }

  /**
   * Get average order value across all customers within date range
   */
  static async getAverageOrderValue(from: string, to: string) {
    const result = await db
      .select({
        avg: sql<number>`CAST(${sum(payments.total)} AS REAL) / CAST(${count(orders.id)} AS REAL)`.mapWith(
          Number
        ),
      })
      .from(orders)
      .innerJoin(payments, eq(orders.id, payments.orderId))
      .innerJoin(membersTable, eq(orders.memberId, membersTable.id))
      .where(
        and(Members.getBaseConditions(from, to), isNotNull(membersTable.id))
      );

    return Math.round(result[0]?.avg ?? 0);
  }

  /**
   * Get total member orders within date range
   */
  static async getTotalMemberOrders(from: string, to: string) {
    const result = await db
      .select({
        totalOrders: count(orders.id).mapWith(Number),
      })
      .from(orders)
      .innerJoin(membersTable, eq(orders.memberId, membersTable.id))
      .where(Members.getBaseConditions(from, to));

    return result[0]?.totalOrders ?? 0;
  }

  /**
   * Get members with spending statistics
   * Includes: id, name, phone, join date, total spending, order count, average spending
   */
  static async getMembersWithSpending(query: SearchQuery) {
    const { search = "", rows = 50, page = 1 } = query;

    // Search conditions
    const searchByName = ilike(membersTable.name, `%${search}%`);
    const searchByPhone = ilike(membersTable.phone, `%${search}%`);
    const whereQuery = or(searchByName, searchByPhone);

    // Main query with aggregations
    const membersQuery = db
      .select({
        id: membersTable.id,
        name: membersTable.name,
        phone: membersTable.phone,
        joinDate: membersTable.createdAt,
        totalSpending: sum(payments.total),
        orderCount: count(orders.id),
        averageSpending:
          sql`CAST(${sum(payments.total)} AS REAL) / NULLIF(CAST(${count(orders.id)} AS REAL), 0)`.mapWith(
            Number
          ),
      })
      .from(membersTable)
      .leftJoin(orders, eq(membersTable.id, orders.memberId))
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(whereQuery)
      .groupBy(membersTable.id)
      .limit(rows)
      .offset((page - 1) * rows)
      .orderBy(desc(sql`COALESCE(${sum(payments.total)}, 0)`));

    // Count query for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(membersTable)
      .where(whereQuery);

    const [members, totalResult] = await Promise.all([
      membersQuery,
      totalQuery,
    ]);

    return {
      members: members.map((member) => ({
        ...member,
        totalSpending: member.totalSpending ?? 0,
        orderCount: member.orderCount ?? 0,
        averageSpending: Math.round(member.averageSpending ?? 0),
      })),
      total: totalResult[0]?.count ?? 0,
    };
  }
}
