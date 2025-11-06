import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const jobStatusEnum = pgEnum("status", [
  "pending",
  "in_progress",
  "completed",
]);

export const jobLogs = pgTable("job_logs", {
  id: uuid().primaryKey(),
  orderId: varchar("order_id", { length: 8 })
    .references(() => orders.id, {
      onDelete: "cascade",
    })
    .notNull(),
  serviceName: varchar("service_name", { length: 50 }).notNull(),
  startTime: timestamp("start_time", { mode: "string" }),
  endTime: timestamp("end_time", { mode: "string" }),
  status: jobStatusEnum(),
});

export const jobLogsRelations = relations(jobLogs, ({ one }) => ({
  order: one(orders, {
    fields: [jobLogs.orderId],
    references: [orders.id],
  }),
}));
