import { relations } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { bookings } from "./bookings";
import { orders } from "./orders";
import { redemptionHistory } from "./redemption-history";

export const members = pgTable("members", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `c-${nanoid()}`),
  name: varchar("name", { length: 50 }).notNull(),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "set null" })
    .unique(),
  phone: varchar("phone", { length: 24 }).unique().notNull(),
  points: integer("points").default(0).notNull(),
});

export const membersRelations = relations(members, ({ many, one }) => ({
  user: one(user, {
    fields: [members.userId],
    references: [user.id],
  }),
  orders: many(orders),
  redemptionHistory: many(redemptionHistory),
  bookings: many(bookings),
}));
