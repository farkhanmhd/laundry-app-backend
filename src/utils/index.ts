import type { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import type { db } from "@/db";

export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

export type TableColumn<T> = ColumnBaseConfig<ColumnDataType, string> & {
  data: T;
};
