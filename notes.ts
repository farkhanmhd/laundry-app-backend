// new order payload

type OrderItem = {
  itemType: "service" | "inventory" | "bundling" | "voucher";
  serviceId?: string | null | undefined;
  inventoryId?: string | null | undefined;
  bundlingId?: string | null | undefined;
  voucherId?: string | null | undefined;
  quantity: number;
};

export type NewOrderPayload = {
  customerName: string;
  memberId?: string | null | undefined;
  staffId: string;
  paymentType: "qris" | "cash";
  amountPaid?: number | null | undefined; // cash only
  change?: number | null | undefined; // cash only
  items: OrderItem[];
};
