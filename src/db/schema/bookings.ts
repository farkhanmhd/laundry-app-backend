import { relations } from "drizzle-orm";
import { pgEnum, pgTable, smallserial, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { machines } from "./machines";
import { members } from "./members";

export const bookingStatusEnum = pgEnum("status", ["confirmed", "completed", "cancelled"]);

export const bookings = pgTable("bookings", {
  id: uuid().primaryKey(),
  memberId: varchar("member_id", { length: 6 })
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  machineId: smallserial("machine_id").references(() => machines.id, {
    onDelete: "cascade",
  }),
  startTime: timestamp("start_time", { mode: "string" }).notNull(),
  endTime: timestamp("end_time", { mode: "string" }).notNull(),
  status: bookingStatusEnum(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  member: one(members, {
    fields: [bookings.memberId],
    references: [members.id],
  }),
  machine: one(machines, {
    fields: [bookings.machineId],
    references: [machines.id],
  }),
}));
