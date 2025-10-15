import { table } from "./schema";
import { services } from "./schema/services";
import { spreads } from "./utils";

export const models = {
  insert: spreads(table, "insert"),
  select: spreads(table, "select"),
  services
} as const;
