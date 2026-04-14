import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { auth } from "@/auth/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { members } from "@/db/schema/members";
import { InternalError } from "@/exceptions";
import type { SearchQuery } from "@/search-query";
import type { CreateCashierSchema, RegisterSchema } from "./model";

export abstract class UserService {
  static async getUsers(query: SearchQuery) {
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

  static async registerUser(body: RegisterSchema) {
    const isMember = !!body.memberId;
    const { name, username, email, password, phoneNumber, memberId } = body;

    const createdUser = await db.transaction(async (tx) => {
      const { user: newUser } = await auth.api.createUser({
        body: {
          email,
          password,
          name,
          role: "user",
          data: {
            displayUsername: username,
            username,
          },
        },
      });

      await tx
        .update(user)
        .set({ phoneNumber: `+62${phoneNumber}` })
        .where(eq(user.id, newUser.id));

      if (!newUser) {
        throw new InternalError("Server Error. Failed to create user");
      }

      if (isMember && memberId) {
        await tx
          .update(members)
          .set({ userId: newUser.id })
          .where(eq(members.id, memberId));
      } else {
        await tx
          .insert(members)
          .values({ name, userId: newUser.id, phone: `+62${phoneNumber}` });
      }

      return newUser.id;
    });

    return createdUser;
  }

  static async createCashier(body: CreateCashierSchema) {
    const { name, username, email, phoneNumber } = body;
    const password = "password";

    const createdUser = await db.transaction(async (tx) => {
      const { user: newUser } = await auth.api.createUser({
        body: {
          email,
          password,
          name,
          role: "admin",
          data: {
            displayUsername: username,
            username,
          },
        },
      });

      if (!newUser) {
        throw new InternalError("Server Error. Failed to create user");
      }

      await tx
        .update(user)
        .set({ phoneNumber: `+62${phoneNumber}` })
        .where(eq(user.id, newUser.id));

      return newUser.id;
    });

    return createdUser;
  }
}
