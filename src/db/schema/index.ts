import { account, session, user, verification } from "./auth";
import { chatParticipants, chats, messages } from "./chats";
import { customers } from "./customers";
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
  customers,
  orderDetails,
  orders,
  payments,
  products,
  redemptionHistory,
  services,
  shifts,
  stockAdjustments,
  vouchers,
  chats,
  chatParticipants,
  messages,
} as const;
