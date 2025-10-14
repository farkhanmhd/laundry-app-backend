import { relations } from "drizzle-orm";
import { pgEnum, pgTable, smallserial, varchar } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { jobLogs } from "./job-logs";

export const machineTypeEnum = pgEnum("type", ["washer", "dryer"]);
export const machineStatusEnum = pgEnum("status", ["available", "in_use", "maintentance"]);

export const machines = pgTable("machines", {
  id: smallserial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: machineTypeEnum(),
  status: machineStatusEnum(),
});

export const machinesRelations = relations(machines, ({ many }) => ({
  bookings: many(bookings),
  jobLogs: many(jobLogs),
}));
