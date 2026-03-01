import { addresses } from "./addresses";
import { adjustmentLogs } from "./adjustment-logs";
import { account, session, user, verification } from "./auth";
import { bundlingItems } from "./bundling-items";
import { bundlings } from "./bundlings";
import { deliveries } from "./deliveries";
import { inventories } from "./inventories";
import { members } from "./members";
import { orderItems } from "./order-items";
import { orders } from "./orders";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";
import { services } from "./services";
import { vouchers } from "./vouchers";

export const table = {
  account,
  user,
  session,
  verification,
  addresses,
  bundlings,
  bundlingItems,
  deliveries,
  inventories,
  members,
  orders,
  orderItems,
  payments,
  redemptionHistory,
  services,
  adjustmentLogs,
  vouchers,
} as const;
