import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export abstract class Staffs {
  static async getStaffs() {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.role, "staff"))
      .orderBy(desc(user.createdAt));

    return rows;
  }
}
