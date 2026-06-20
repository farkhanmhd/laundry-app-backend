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
  isNull,
  or,
  type SQL,
  sql,
  sum,
} from "drizzle-orm";
import { db } from "@/db";
import { members as membersTable } from "@/db/schema/members";
import { orders } from "@/db/schema/orders";
import { payments } from "@/db/schema/payments";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import type {
  AddMemberBody,
  GetMembersWithSpendingQuery,
  MembersQuery,
} from "./model";

export abstract class Members {
  static async getMembers(query: MembersQuery) {
    try {
      const { search = "", rows = 50, page = 1, type } = query;
      const searchById = ilike(membersTable.id, `%${search}%`);
      const searchByName = ilike(membersTable.name, `%${search}%`);
      const searchByPhone = ilike(membersTable.phone, `%${search}%`);

      const filters: SQL[] = [];
      if (type?.includes("user")) {
        filters.push(isNotNull(membersTable.userId));
      }
      if (type?.includes("non-user")) {
        filters.push(isNull(membersTable.userId));
      }

      const conditions = [
        or(searchById, searchByName, searchByPhone),
        ...filters,
      ];
      const whereQuery = and(...conditions);

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
    } catch (error) {
      console.error("Error fetching members:", error);
      throw new InternalError("Could not retrieve members.");
    }
  }

  static async addMember(data: AddMemberBody) {
    try {
      const result = await db
        .insert(membersTable)
        .values({
          ...data,
          phone: `+62${data.phone}`,
        })
        .returning({ id: membersTable.id });

      if (!result.length) {
        throw new InternalError("Failed to create the new member.");
      }

      return result[0]?.id as string;
    } catch (error) {
      if (
        (error as { cause?: { message?: string } })?.cause?.message?.includes(
          'unique constraint "members_phone_unique"'
        )
      ) {
        throw new ConflictError("Phone number already registered");
      }
      if (error instanceof InternalError) {
        throw error;
      }
      console.error("Error adding member:", error);
      throw new InternalError("Failed to create the new member.");
    }
  }

  /**
   * Helper: Base condition ensures we only look at completed orders within the date range.
   */
  private static getBaseConditions(from: string, to: string) {
    const parsedFrom = parse(from, "dd-MM-yyyy", new Date());
    const parsedTo = parse(to, "dd-MM-yyyy", new Date());

    const startDate = startOfDay(parsedFrom);
    const endDate = endOfDay(parsedTo);

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
    try {
      const result = await db.select({ count: count() }).from(membersTable);

      return result[0]?.count ?? 0;
    } catch (error) {
      console.error("Error fetching total customers:", error);
      throw new InternalError("Could not retrieve total customers.");
    }
  }

  /**
   * Get count of active members within date range
   */
  static async getActiveMembers(from: string, to: string) {
    try {
      const result = await db
        .selectDistinct({
          memberId: membersTable.id,
        })
        .from(orders)
        .innerJoin(membersTable, eq(orders.memberId, membersTable.id))
        .where(Members.getBaseConditions(from, to));

      return result.length ?? [];
    } catch (error) {
      console.error("Error fetching active members:", error);
      throw new InternalError("Could not retrieve active members.");
    }
  }

  /**
   * Get average order value across all customers within date range
   */
  static async getAverageOrderValue(from: string, to: string) {
    try {
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
    } catch (error) {
      console.error("Error fetching average order value:", error);
      throw new InternalError("Could not retrieve average order value.");
    }
  }

  /**
   * Get total member orders within date range
   */
  static async getTotalMemberOrders(from: string, to: string) {
    try {
      const result = await db
        .select({
          totalOrders: count(orders.id).mapWith(Number),
        })
        .from(orders)
        .innerJoin(membersTable, eq(orders.memberId, membersTable.id))
        .where(Members.getBaseConditions(from, to));

      return result[0]?.totalOrders ?? 0;
    } catch (error) {
      console.error("Error fetching total member orders:", error);
      throw new InternalError("Could not retrieve total member orders.");
    }
  }

  /**
   * Get members with spending statistics
   */
  static async getMembersWithSpending(query: GetMembersWithSpendingQuery) {
    try {
      const { search = "", rows = 50, page = 1, from, to, type } = query;

      const searchByName = ilike(membersTable.name, `%${search}%`);
      const searchByPhone = ilike(membersTable.phone, `%${search}%`);

      const filters: SQL[] = [];
      if (type?.includes("user")) {
        filters.push(isNotNull(membersTable.userId));
      }
      if (type?.includes("non-user")) {
        filters.push(isNull(membersTable.userId));
      }

      const dateRange = Members.getBaseConditions(from, to);
      const whereQuery = and(or(searchByName, searchByPhone), ...filters);

      const membersQuery = db
        .select({
          id: membersTable.id,
          userId: membersTable.userId,
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
        .leftJoin(orders, and(eq(membersTable.id, orders.memberId), dateRange))
        .leftJoin(payments, eq(orders.id, payments.orderId))
        .where(whereQuery)
        .groupBy(membersTable.id)
        .limit(rows)
        .offset((page - 1) * rows)
        .orderBy(desc(sql`COALESCE(${sum(payments.total)}, 0)`));

      const totalQuery = db
        .select({ count: count() })
        .from(membersTable)
        .leftJoin(orders, eq(membersTable.id, orders.memberId))
        .leftJoin(payments, eq(orders.id, payments.orderId))
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
    } catch (error) {
      console.error("Error fetching members with spending:", error);
      throw new InternalError("Could not retrieve members spending data.");
    }
  }

  static async getMemberPoints(userId: string) {
    try {
      const row = await db
        .select({ points: membersTable.points })
        .from(membersTable)
        .where(eq(membersTable.userId, userId))
        .limit(1);

      if (!row[0]) {
        throw new NotFoundError("Member not found");
      }

      const points = row[0].points ?? 0;

      return points;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Error fetching member points:", error);
      throw new InternalError("Could not retrieve member points.");
    }
  }

  static async getMemberByPhone(phone: string) {
    try {
      const formattedPhone = `+62${phone}`;
      const [member] = await db
        .select({
          memberId: membersTable.id,
          name: membersTable.name,
          phoneNumber: membersTable.phone,
          userId: membersTable.userId,
        })
        .from(membersTable)
        .where(eq(membersTable.phone, formattedPhone))
        .limit(1);

      return member;
    } catch (error) {
      console.error("Error fetching member by phone:", error);
      throw new InternalError("Could not retrieve member.");
    }
  }
}
