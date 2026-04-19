import type { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import { t } from "elysia";
import type { db } from "@/db";
import type { orderItems } from "@/db/schema/order-items";
import type { payments } from "@/db/schema/payments";

export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

export type TableColumn<T> = ColumnBaseConfig<ColumnDataType, string> & {
  data: T;
};

export type ItemType = (typeof orderItems.$inferSelect)["itemType"];
export type PaymentType = (typeof payments.$inferSelect)["paymentType"];

export const LAUNDRY_POINT_ZERO: string = "98.7525,3.5911";

export const dateRangeQuery = t.Object({
  from: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$", // Regex: only allows "20-01-2026" format
    error: "Date must be in dd-MM-yyyy format", // Custom error message
  }),
  to: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$",
    error: "Date must be in dd-MM-yyyy format",
  }),
});

export type DateRangeQuery = typeof dateRangeQuery.static;
