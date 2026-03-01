interface TransactionDetail {
  order_id: string;
  gross_amount: number;
}

interface CustomerDetails {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  billing_address?: {
    first_name: string;
    last_name?: string;
    phone?: string;
    address: string;
    city: string;
    postal_code?: string;
    country_code?: string;
  };
  shipping_address?: {
    first_name: string;
    last_name?: string;
    phone?: string;
    address: string;
    city: string;
    postal_code?: string;
    country_code?: string;
  };
}

export interface ItemDetails {
  id?: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
  tenor?: number;
  code_plan?: number;
  mid?: number;
  url?: string;
}

interface QrisDetail {
  acquirer?: "gopay" | "airpay shopee";
}

interface GopayDetail {
  enable_callback?: boolean;
  callback_url?: string;
  account_id?: string;
  payment_option_token?: string;
  pre_auth?: boolean;
  recurring?: boolean;
  promotion_ids?: string[];
}

interface MandiriBill {
  bill_info1: string;
  bill_info2: string;
  bill_info3?: string;
  bill_info4?: string;
  bill_info5?: string;
  bill_info6?: string;
  bill_info7?: string;
  bill_info8?: string;
  bill_key?: string;
}

export type PaymentType =
  | "qris"
  | "gopay"
  | "bank_transfer"
  | "permata"
  | "echannel";

export type BankTransferType = "bca" | "bri" | "bni" | "cimb";

type BankTransfer = {
  bank: BankTransferType;
};

export interface ChargeDetails {
  payment_type: PaymentType;
  transaction_details: TransactionDetail;
  customer_details?: CustomerDetails;
  item_details: ItemDetails[];
  qris?: QrisDetail;
  gopay?: GopayDetail;
  bank_transfer?: BankTransfer;
  echannel?: MandiriBill;
}

export interface QrisAction {
  name: string;
  method: string;
  url: string;
}

export interface QrisTransactionResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: "qris";
  transaction_time: string;
  transaction_status: string;
  fraud_status: string;
  actions: QrisAction[];
  acquirer: string;
  qr_string: string;
  expiry_time: string;
}
