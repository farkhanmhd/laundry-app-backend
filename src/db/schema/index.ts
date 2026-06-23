import { addresses } from "./addresses";
import { adjustmentLogs } from "./adjustment-logs";
import { assets } from "./assets";
import { account, session, user, verification } from "./auth";
import { bundlingItems } from "./bundling-items";
import { bundlings } from "./bundlings";
import { deliveries } from "./deliveries";
import { inventories } from "./inventories";
import { inventoryLogs } from "./inventory-logs";
import { members } from "./members";
import { orderItems } from "./order-items";
import { orders } from "./orders";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";
import { routes } from "./routes";
import { services } from "./services";
import { vouchers } from "./vouchers";
import { weightRanges } from "./weight-ranges";

export const table = {
  account,
  user,
  session,
  verification,
  addresses,
  assets,
  bundlings,
  bundlingItems,
  deliveries,
  inventories,
  inventoryLogs,
  members,
  orders,
  orderItems,
  payments,
  redemptionHistory,
  routes,
  services,
  adjustmentLogs,
  vouchers,
  weightRanges,
} as const;
