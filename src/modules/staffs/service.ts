import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

export abstract class Staffs {
  static async getStaffs() {
    const rows = await db
      .select()
      .from(user)
      .where(inArray(user.role, ["admin", "driver", "superadmin"]))
      .orderBy(desc(user.createdAt));

    return rows;
  }
}
