import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";

export const services = pgTable("services", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$default(() => `s-${nanoid()}`),
  name: varchar("name", { length: 128 }).notNull(),
  image: varchar("image"),
  price: integer("price").notNull(),
});
