import { db } from "@/db";
import { customers } from "@/db/schema/customers";
import { InternalError } from "@/exceptions";
import type { AddCustomerBody } from "./model";

export abstract class Customers {
  static async getCustomers() {
    const rows = await db.select().from(customers);

    return rows;
  }

  static async addCustomer(data: AddCustomerBody) {
    const result = await db.insert(customers).values(data).returning({ id: customers.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }
}
