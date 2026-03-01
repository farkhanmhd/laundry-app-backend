import type { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
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
