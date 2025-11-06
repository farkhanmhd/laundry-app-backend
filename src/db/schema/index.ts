import { account, session, user, verification } from "./auth";
import { jobLogs } from "./job-logs";
import { members } from "./members";
import { orderDetails } from "./order-details";
import { orders } from "./orders";
import { payments } from "./payments";
import { products } from "./products";
import { redemptionHistory } from "./redemption-history";
import { services } from "./services";
import { shifts } from "./shifts";
import { stockAdjustments } from "./stock-adjustments";
import { vouchers } from "./vouchers";

export const table = {
  account,
  user,
  session,
  verification,
  members,
  orderDetails,
  orders,
  payments,
  products,
  redemptionHistory,
  services,
  shifts,
  stockAdjustments,
  vouchers,
  jobLogs,
} as const;
