import { Elysia } from "elysia";
declare const app: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    typebox: import("@sinclair/typebox").TModule<{}>;
    error: {};
} & {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {};
} & {
    typebox: {
        readonly succesResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
        }>;
        readonly failedResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"failed">;
            message: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
} & {
    typebox: {};
    error: {
        readonly INTERNAL_ERROR: import("./exceptions").InternalError;
        readonly NOT_FOUND_RESOURCE: import("./exceptions").NotFoundError;
        readonly UNAUTHORIZED: import("./exceptions").AuthorizationError;
    };
} & {
    typebox: {
        readonly addInventory: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            image: import("@sinclair/typebox").TUnsafe<File>;
            price: import("@sinclair/typebox").TNumber;
            stock: import("@sinclair/typebox").TNumber;
            description: import("@sinclair/typebox").TString;
            safetyStock: import("@sinclair/typebox").TNumber;
        }>;
        readonly addInventoryResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly getInventories: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
                name: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TString;
                image: import("@sinclair/typebox").TString;
                price: import("@sinclair/typebox").TInteger;
                stock: import("@sinclair/typebox").TInteger;
                safetyStock: import("@sinclair/typebox").TInteger;
                createdAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                updatedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                deletedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            }>>;
        }>;
        readonly updateInventory: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            price: import("@sinclair/typebox").TNumber;
            safetyStock: import("@sinclair/typebox").TNumber;
        }>;
        readonly updateInventoryImage: import("@sinclair/typebox").TObject<{
            image: import("@sinclair/typebox").TUnsafe<File>;
        }>;
        readonly adjustQuantity: import("@sinclair/typebox").TObject<{
            note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            changeAmount: import("@sinclair/typebox").TInteger;
            adjustmentTime: import("@sinclair/typebox").TDate;
        }>;
        readonly inventoryHistoryQuery: import("@sinclair/typebox").TObject<{
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            inventoryIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
            from: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            to: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        readonly inventoryReportQuery: import("@sinclair/typebox").TObject<{
            from: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            to: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        readonly restockQuantity: import("@sinclair/typebox").TObject<{
            supplier: import("@sinclair/typebox").TString;
            restockQuantity: import("@sinclair/typebox").TInteger;
            restockTime: import("@sinclair/typebox").TDate;
            note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly getMembersWithSpendingQuery: import("@sinclair/typebox").TObject<{
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            from: import("@sinclair/typebox").TString;
            to: import("@sinclair/typebox").TString;
        }>;
        readonly addMember: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            phone: import("@sinclair/typebox").TString;
        }>;
        readonly dateRangeQuery: import("@sinclair/typebox").TObject<{
            from: import("@sinclair/typebox").TString;
            to: import("@sinclair/typebox").TString;
        }>;
        readonly searchByPhoneQuery: import("@sinclair/typebox").TObject<{
            phone: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly searchQuery: import("@sinclair/typebox").TObject<{
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly addService: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            image: import("@sinclair/typebox").TUnsafe<File>;
            price: import("@sinclair/typebox").TNumber;
        }>;
        readonly addServiceResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly getServices: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
                name: import("@sinclair/typebox").TString;
                image: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TString;
                price: import("@sinclair/typebox").TInteger;
                createdAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                updatedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                deletedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            }>>;
        }>;
        readonly updateService: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            price: import("@sinclair/typebox").TNumber;
        }>;
        readonly updateServiceImage: import("@sinclair/typebox").TObject<{
            image: import("@sinclair/typebox").TUnsafe<File>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly voucherInsert: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            code: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            discountPercentage: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            discountAmount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TInteger, import("@sinclair/typebox").TNull]>>;
            minSpend: import("@sinclair/typebox").TInteger;
            maxDiscountAmount: import("@sinclair/typebox").TInteger;
            isVisible: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            createdAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            deletedAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        }>;
        readonly addVoucherResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly getVouchers: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TString;
                code: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TString;
                discountPercentage: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                discountAmount: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TInteger, import("@sinclair/typebox").TNull]>;
                minSpend: import("@sinclair/typebox").TInteger;
                maxDiscountAmount: import("@sinclair/typebox").TInteger;
                isVisible: import("@sinclair/typebox").TBoolean;
                expiresAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                createdAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
                deletedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            }>>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly addBundling: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            image: import("@sinclair/typebox").TUnsafe<File>;
            price: import("@sinclair/typebox").TNumber;
            description: import("@sinclair/typebox").TString;
            items: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                itemType: import("@sinclair/typebox").TEnum<{
                    service: "service";
                    inventory: "inventory";
                }>;
                serviceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                inventoryId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                quantity: import("@sinclair/typebox").TInteger;
            }>>;
        }>;
        readonly updateBundlingData: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            price: import("@sinclair/typebox").TInteger;
        }>;
        readonly updateBundlingItemBody: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            itemType: import("@sinclair/typebox").TEnum<{
                service: "service";
                inventory: "inventory";
            }>;
            serviceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            inventoryId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            quantity: import("@sinclair/typebox").TInteger;
            id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            bundlingId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        }>>;
        readonly updateBundlingImage: import("@sinclair/typebox").TObject<{
            image: import("@sinclair/typebox").TUnsafe<File>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly posItem: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TString;
            price: import("@sinclair/typebox").TNumber;
            image: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            stock: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
            itemType: import("@sinclair/typebox").TString;
        }>;
        readonly newPosOrderSchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            items: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                bundlingId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                itemType: import("@sinclair/typebox").TEnum<{
                    service: "service";
                    inventory: "inventory";
                    points: "points";
                    bundling: "bundling";
                    voucher: "voucher";
                }>;
                serviceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                inventoryId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                quantity: import("@sinclair/typebox").TInteger;
                note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                voucherId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            }>>;
            customerName: import("@sinclair/typebox").TString;
            phone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            points: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>>;
            memberId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            newMember: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull]>>;
            paymentType: import("@sinclair/typebox").TLiteral<"cash">;
            amountPaid: import("@sinclair/typebox").TInteger;
        }>, import("@sinclair/typebox").TObject<{
            items: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                bundlingId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                itemType: import("@sinclair/typebox").TEnum<{
                    service: "service";
                    inventory: "inventory";
                    points: "points";
                    bundling: "bundling";
                    voucher: "voucher";
                }>;
                serviceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                inventoryId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                quantity: import("@sinclair/typebox").TInteger;
                note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                voucherId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            }>>;
            customerName: import("@sinclair/typebox").TString;
            phone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            points: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>>;
            memberId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            newMember: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull]>>;
            paymentType: import("@sinclair/typebox").TLiteral<"qris">;
        }>]>;
    };
    error: {};
} & {
    typebox: {
        readonly midtransNotification: import("@sinclair/typebox").TObject<{
            transaction_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"on-us">, import("@sinclair/typebox").TLiteral<"off-us">]>;
            transaction_time: import("@sinclair/typebox").TString;
            transaction_status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"capture">, import("@sinclair/typebox").TLiteral<"settlement">, import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"deny">, import("@sinclair/typebox").TLiteral<"expire">, import("@sinclair/typebox").TLiteral<"cancel">]>;
            transaction_id: import("@sinclair/typebox").TString;
            status_message: import("@sinclair/typebox").TString;
            status_code: import("@sinclair/typebox").TString;
            signature_key: import("@sinclair/typebox").TString;
            settlement_time: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            pop_id: import("@sinclair/typebox").TString;
            payment_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"qris">, import("@sinclair/typebox").TLiteral<"gopay">, import("@sinclair/typebox").TLiteral<"bank_transfer">, import("@sinclair/typebox").TLiteral<"credit_card">]>;
            order_id: import("@sinclair/typebox").TString;
            merchant_id: import("@sinclair/typebox").TString;
            merchant_cross_reference_id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            issuer: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            gross_amount: import("@sinclair/typebox").TString;
            fraud_status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"accept">, import("@sinclair/typebox").TLiteral<"deny">, import("@sinclair/typebox").TLiteral<"pending">]>;
            expiry_time: import("@sinclair/typebox").TString;
            customer_details: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            currency: import("@sinclair/typebox").TString;
            acquirer: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        readonly midtransNotificationResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                transaction_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"on-us">, import("@sinclair/typebox").TLiteral<"off-us">]>;
                transaction_time: import("@sinclair/typebox").TString;
                transaction_status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"capture">, import("@sinclair/typebox").TLiteral<"settlement">, import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"deny">, import("@sinclair/typebox").TLiteral<"expire">, import("@sinclair/typebox").TLiteral<"cancel">]>;
                transaction_id: import("@sinclair/typebox").TString;
                status_message: import("@sinclair/typebox").TString;
                status_code: import("@sinclair/typebox").TString;
                signature_key: import("@sinclair/typebox").TString;
                settlement_time: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                pop_id: import("@sinclair/typebox").TString;
                payment_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"qris">, import("@sinclair/typebox").TLiteral<"gopay">, import("@sinclair/typebox").TLiteral<"bank_transfer">, import("@sinclair/typebox").TLiteral<"credit_card">]>;
                order_id: import("@sinclair/typebox").TString;
                merchant_id: import("@sinclair/typebox").TString;
                merchant_cross_reference_id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                issuer: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                gross_amount: import("@sinclair/typebox").TString;
                fraud_status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"accept">, import("@sinclair/typebox").TLiteral<"deny">, import("@sinclair/typebox").TLiteral<"pending">]>;
                expiry_time: import("@sinclair/typebox").TString;
                customer_details: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
                currency: import("@sinclair/typebox").TString;
                acquirer: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly dateRangeQuery: import("@sinclair/typebox").TObject<{
            from: import("@sinclair/typebox").TString;
            to: import("@sinclair/typebox").TString;
        }>;
        readonly netRevenueResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TNumber;
                currency: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly grossRevenueResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TNumber;
                currency: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly transactionCountResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                count: import("@sinclair/typebox").TNumber;
            }>;
        }>;
        readonly avgOrderValueResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TNumber;
                currency: import("@sinclair/typebox").TString;
            }>;
        }>;
        readonly scorecardDataResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                netRevenue: import("@sinclair/typebox").TNumber;
                grossRevenue: import("@sinclair/typebox").TNumber;
                transactionCount: import("@sinclair/typebox").TNumber;
                avgOrderValue: import("@sinclair/typebox").TNumber;
            }>;
        }>;
        readonly chartDataResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                date: import("@sinclair/typebox").TString;
                net: import("@sinclair/typebox").TNumber;
                discount: import("@sinclair/typebox").TNumber;
                gross: import("@sinclair/typebox").TNumber;
            }>>;
        }>;
        readonly bestSellersQuery: import("@sinclair/typebox").TObject<{
            from: import("@sinclair/typebox").TString;
            to: import("@sinclair/typebox").TString;
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            item_type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>]>>;
            item_id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>]>>;
        }>;
        readonly bestSellersResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TLiteral<"success">;
            message: import("@sinclair/typebox").TString;
            data: import("@sinclair/typebox").TObject<{
                items: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    id: import("@sinclair/typebox").TString;
                    itemName: import("@sinclair/typebox").TString;
                    itemType: import("@sinclair/typebox").TString;
                    price: import("@sinclair/typebox").TNumber;
                    totalUnitsSold: import("@sinclair/typebox").TNumber;
                    transactionCount: import("@sinclair/typebox").TNumber;
                    totalRevenue: import("@sinclair/typebox").TNumber;
                }>>;
                meta: import("@sinclair/typebox").TObject<{
                    total: import("@sinclair/typebox").TNumber;
                    page: import("@sinclair/typebox").TNumber;
                    rows: import("@sinclair/typebox").TNumber;
                    totalPages: import("@sinclair/typebox").TNumber;
                }>;
            }>;
        }>;
        readonly salesByOrderQuery: import("@sinclair/typebox").TObject<{
            from: import("@sinclair/typebox").TString;
            to: import("@sinclair/typebox").TString;
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
            payment_type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TNull]>>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly updateUserRoleSchema: import("@sinclair/typebox").TObject<{
            userId: import("@sinclair/typebox").TString;
            role: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"admin">, import("@sinclair/typebox").TLiteral<"user">]>;
        }>;
        readonly registerUserSchema: import("@sinclair/typebox").TObject<{
            phoneNumber: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TString;
            username: import("@sinclair/typebox").TString;
            email: import("@sinclair/typebox").TString;
            password: import("@sinclair/typebox").TString;
            memberId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        }>;
        readonly createCashierSchema: import("@sinclair/typebox").TObject<{
            username: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TString;
            email: import("@sinclair/typebox").TString;
            phoneNumber: import("@sinclair/typebox").TString;
        }>;
        readonly connectMemberSchema: import("@sinclair/typebox").TObject<{
            memberId: import("@sinclair/typebox").TString;
            phoneNumber: import("@sinclair/typebox").TString;
        }>;
        readonly createMemberSchema: import("@sinclair/typebox").TObject<{
            name: import("@sinclair/typebox").TString;
            phoneNumber: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly requestPickupSchema: import("@sinclair/typebox").TObject<{
            items: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                bundlingId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                itemType: import("@sinclair/typebox").TEnum<{
                    service: "service";
                    inventory: "inventory";
                    points: "points";
                    bundling: "bundling";
                    voucher: "voucher";
                }>;
                serviceId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                inventoryId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                quantity: import("@sinclair/typebox").TInteger;
                note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
                voucherId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
            }>>;
            addressId: import("@sinclair/typebox").TString;
            points: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>>;
        }>;
        readonly requestDeliverySchema: import("@sinclair/typebox").TObject<{
            addressId: import("@sinclair/typebox").TString;
            orderId: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly updateInfo: import("@sinclair/typebox").TObject<{
            username: import("@sinclair/typebox").TString;
            name: import("@sinclair/typebox").TString;
            email: import("@sinclair/typebox").TString;
            phone: import("@sinclair/typebox").TString;
        }>;
        readonly updatePassword: import("@sinclair/typebox").TObject<{
            currentPassword: import("@sinclair/typebox").TString;
            newPassword: import("@sinclair/typebox").TString;
        }>;
        readonly addAddress: import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            street: import("@sinclair/typebox").TString;
            lat: import("@sinclair/typebox").TNumber;
            lng: import("@sinclair/typebox").TNumber;
            note: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
        }>;
        readonly updateAddress: import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            street: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lat: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            lng: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            note: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        readonly updatePhoneNumber: import("@sinclair/typebox").TObject<{
            phoneNumber: import("@sinclair/typebox").TString;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly deliveryListItem: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            orderId: import("@sinclair/typebox").TString;
            type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pickup">, import("@sinclair/typebox").TLiteral<"delivery">]>;
            status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"requested">, import("@sinclair/typebox").TLiteral<"in_progress">, import("@sinclair/typebox").TLiteral<"picked_up">, import("@sinclair/typebox").TLiteral<"completed">, import("@sinclair/typebox").TLiteral<"cancelled">]>;
            address: import("@sinclair/typebox").TString;
            date: import("@sinclair/typebox").TString;
        }>;
        readonly deliveryDetail: import("@sinclair/typebox").TObject<{
            id: import("@sinclair/typebox").TString;
            type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pickup">, import("@sinclair/typebox").TLiteral<"delivery">]>;
            status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"requested">, import("@sinclair/typebox").TLiteral<"in_progress">, import("@sinclair/typebox").TLiteral<"picked_up">, import("@sinclair/typebox").TLiteral<"completed">, import("@sinclair/typebox").TLiteral<"cancelled">]>;
            notes: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            requestedAt: import("@sinclair/typebox").TString;
            completedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            orderId: import("@sinclair/typebox").TString;
            addressLabel: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            address: import("@sinclair/typebox").TString;
            addressNotes: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            latitude: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
            longitude: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
        }>;
    };
    error: {};
} & {
    typebox: {
        readonly deliveriesSearchQuery: import("@sinclair/typebox").TObject<{
            search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            rows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"requested">, import("@sinclair/typebox").TLiteral<"assigned">, import("@sinclair/typebox").TLiteral<"in_progress">, import("@sinclair/typebox").TLiteral<"completed">, import("@sinclair/typebox").TLiteral<"cancelled">]>>;
        }>;
        readonly createRouteSchema: import("@sinclair/typebox").TObject<{
            deliveryIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        }>;
        readonly updateDeliveryStatusSchema: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"requested">, import("@sinclair/typebox").TLiteral<"in_progress">, import("@sinclair/typebox").TLiteral<"picked_up">, import("@sinclair/typebox").TLiteral<"completed">, import("@sinclair/typebox").TLiteral<"cancelled">]>;
        }>;
    };
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: Partial<{
        readonly auth: boolean;
        readonly isCustomer: boolean;
        readonly isAdmin: boolean;
        readonly isSuperAdmin: boolean;
    }>;
    macroFn: {
        readonly auth: {
            readonly resolve: ({ request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/dist/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/dist/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {};
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 200 | 422 | 400 | 100 | 101 | 102 | 103 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<{
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    phoneNumber: string | null;
                    role: "user" | "superadmin" | "admin" | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    impersonatedBy?: string | null | undefined;
                };
            }>;
        };
        readonly isCustomer: {
            readonly resolve: ({ request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/dist/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/dist/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {};
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 200 | 422 | 400 | 100 | 101 | 102 | 103 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<{
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    phoneNumber: string | null;
                    role: "user" | "superadmin" | "admin" | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    impersonatedBy?: string | null | undefined;
                };
            }>;
        };
        readonly isAdmin: {
            readonly resolve: ({ request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/dist/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/dist/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {};
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 200 | 422 | 400 | 100 | 101 | 102 | 103 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<{
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    phoneNumber: string | null;
                    role: "user" | "superadmin" | "admin" | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    impersonatedBy?: string | null | undefined;
                };
            }>;
        };
        readonly isSuperAdmin: {
            readonly resolve: ({ request: { headers } }: {
                body: unknown;
                query: Record<string, string>;
                params: {};
                headers: Record<string, string | undefined>;
                cookie: Record<string, import("elysia").Cookie<unknown>>;
                server: import("elysia/dist/universal/server").Server | null;
                redirect: import("elysia").redirect;
                set: {
                    headers: import("elysia").HTTPHeaders;
                    status?: number | keyof import("elysia").StatusMap;
                    redirect?: string;
                    cookie?: Record<string, import("elysia/dist/cookies").ElysiaCookie>;
                };
                path: string;
                route: string;
                request: Request;
                store: {};
                status: <const Code extends number | keyof import("elysia").StatusMap, const T = Code extends 200 | 422 | 400 | 100 | 101 | 102 | 103 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 300 | 301 | 302 | 303 | 304 | 307 | 308 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 ? {
                    readonly 100: "Continue";
                    readonly 101: "Switching Protocols";
                    readonly 102: "Processing";
                    readonly 103: "Early Hints";
                    readonly 200: "OK";
                    readonly 201: "Created";
                    readonly 202: "Accepted";
                    readonly 203: "Non-Authoritative Information";
                    readonly 204: "No Content";
                    readonly 205: "Reset Content";
                    readonly 206: "Partial Content";
                    readonly 207: "Multi-Status";
                    readonly 208: "Already Reported";
                    readonly 300: "Multiple Choices";
                    readonly 301: "Moved Permanently";
                    readonly 302: "Found";
                    readonly 303: "See Other";
                    readonly 304: "Not Modified";
                    readonly 307: "Temporary Redirect";
                    readonly 308: "Permanent Redirect";
                    readonly 400: "Bad Request";
                    readonly 401: "Unauthorized";
                    readonly 402: "Payment Required";
                    readonly 403: "Forbidden";
                    readonly 404: "Not Found";
                    readonly 405: "Method Not Allowed";
                    readonly 406: "Not Acceptable";
                    readonly 407: "Proxy Authentication Required";
                    readonly 408: "Request Timeout";
                    readonly 409: "Conflict";
                    readonly 410: "Gone";
                    readonly 411: "Length Required";
                    readonly 412: "Precondition Failed";
                    readonly 413: "Payload Too Large";
                    readonly 414: "URI Too Long";
                    readonly 415: "Unsupported Media Type";
                    readonly 416: "Range Not Satisfiable";
                    readonly 417: "Expectation Failed";
                    readonly 418: "I'm a teapot";
                    readonly 420: "Enhance Your Calm";
                    readonly 421: "Misdirected Request";
                    readonly 422: "Unprocessable Content";
                    readonly 423: "Locked";
                    readonly 424: "Failed Dependency";
                    readonly 425: "Too Early";
                    readonly 426: "Upgrade Required";
                    readonly 428: "Precondition Required";
                    readonly 429: "Too Many Requests";
                    readonly 431: "Request Header Fields Too Large";
                    readonly 451: "Unavailable For Legal Reasons";
                    readonly 500: "Internal Server Error";
                    readonly 501: "Not Implemented";
                    readonly 502: "Bad Gateway";
                    readonly 503: "Service Unavailable";
                    readonly 504: "Gateway Timeout";
                    readonly 505: "HTTP Version Not Supported";
                    readonly 506: "Variant Also Negotiates";
                    readonly 507: "Insufficient Storage";
                    readonly 508: "Loop Detected";
                    readonly 510: "Not Extended";
                    readonly 511: "Network Authentication Required";
                }[Code] : Code>(code: Code, response?: T) => import("elysia").ElysiaCustomStatusResponse<Code, T, Code extends "Continue" | "Switching Protocols" | "Processing" | "Early Hints" | "OK" | "Created" | "Accepted" | "Non-Authoritative Information" | "No Content" | "Reset Content" | "Partial Content" | "Multi-Status" | "Already Reported" | "Multiple Choices" | "Moved Permanently" | "Found" | "See Other" | "Not Modified" | "Temporary Redirect" | "Permanent Redirect" | "Bad Request" | "Unauthorized" | "Payment Required" | "Forbidden" | "Not Found" | "Method Not Allowed" | "Not Acceptable" | "Proxy Authentication Required" | "Request Timeout" | "Conflict" | "Gone" | "Length Required" | "Precondition Failed" | "Payload Too Large" | "URI Too Long" | "Unsupported Media Type" | "Range Not Satisfiable" | "Expectation Failed" | "I'm a teapot" | "Enhance Your Calm" | "Misdirected Request" | "Unprocessable Content" | "Locked" | "Failed Dependency" | "Too Early" | "Upgrade Required" | "Precondition Required" | "Too Many Requests" | "Request Header Fields Too Large" | "Unavailable For Legal Reasons" | "Internal Server Error" | "Not Implemented" | "Bad Gateway" | "Service Unavailable" | "Gateway Timeout" | "HTTP Version Not Supported" | "Variant Also Negotiates" | "Insufficient Storage" | "Loop Detected" | "Not Extended" | "Network Authentication Required" ? {
                    readonly Continue: 100;
                    readonly "Switching Protocols": 101;
                    readonly Processing: 102;
                    readonly "Early Hints": 103;
                    readonly OK: 200;
                    readonly Created: 201;
                    readonly Accepted: 202;
                    readonly "Non-Authoritative Information": 203;
                    readonly "No Content": 204;
                    readonly "Reset Content": 205;
                    readonly "Partial Content": 206;
                    readonly "Multi-Status": 207;
                    readonly "Already Reported": 208;
                    readonly "Multiple Choices": 300;
                    readonly "Moved Permanently": 301;
                    readonly Found: 302;
                    readonly "See Other": 303;
                    readonly "Not Modified": 304;
                    readonly "Temporary Redirect": 307;
                    readonly "Permanent Redirect": 308;
                    readonly "Bad Request": 400;
                    readonly Unauthorized: 401;
                    readonly "Payment Required": 402;
                    readonly Forbidden: 403;
                    readonly "Not Found": 404;
                    readonly "Method Not Allowed": 405;
                    readonly "Not Acceptable": 406;
                    readonly "Proxy Authentication Required": 407;
                    readonly "Request Timeout": 408;
                    readonly Conflict: 409;
                    readonly Gone: 410;
                    readonly "Length Required": 411;
                    readonly "Precondition Failed": 412;
                    readonly "Payload Too Large": 413;
                    readonly "URI Too Long": 414;
                    readonly "Unsupported Media Type": 415;
                    readonly "Range Not Satisfiable": 416;
                    readonly "Expectation Failed": 417;
                    readonly "I'm a teapot": 418;
                    readonly "Enhance Your Calm": 420;
                    readonly "Misdirected Request": 421;
                    readonly "Unprocessable Content": 422;
                    readonly Locked: 423;
                    readonly "Failed Dependency": 424;
                    readonly "Too Early": 425;
                    readonly "Upgrade Required": 426;
                    readonly "Precondition Required": 428;
                    readonly "Too Many Requests": 429;
                    readonly "Request Header Fields Too Large": 431;
                    readonly "Unavailable For Legal Reasons": 451;
                    readonly "Internal Server Error": 500;
                    readonly "Not Implemented": 501;
                    readonly "Bad Gateway": 502;
                    readonly "Service Unavailable": 503;
                    readonly "Gateway Timeout": 504;
                    readonly "HTTP Version Not Supported": 505;
                    readonly "Variant Also Negotiates": 506;
                    readonly "Insufficient Storage": 507;
                    readonly "Loop Detected": 508;
                    readonly "Not Extended": 510;
                    readonly "Network Authentication Required": 511;
                }[Code] : Code>;
            }) => Promise<{
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    image: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    username: string | null;
                    displayUsername: string | null;
                    phoneNumber: string | null;
                    role: "user" | "superadmin" | "admin" | null;
                    banned: boolean | null;
                    banReason: string | null;
                    banExpires: Date | null;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                    impersonatedBy?: string | null | undefined;
                };
            }>;
        };
    };
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        [x: number]: {
            status: string;
            message: string;
        };
        422: {
            readonly status: "failed";
            readonly message: "Validation failed";
            readonly errors: ({
                message: string;
            } | null)[];
        };
    };
}, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: string;
            };
        };
    };
} & {
    inventories: {};
} & {
    inventories: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Inventories Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        description: string;
                        image: string;
                        price: number;
                        stock: number;
                        safetyStock: number;
                        createdAt: string | null;
                        updatedAt: string | null;
                        deletedAt: string | null;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Inventories Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        description: string;
                        image: string;
                        price: number;
                        stock: number;
                        safetyStock: number;
                        createdAt: string | null;
                        updatedAt: string | null;
                        deletedAt: string | null;
                    }[];
                };
                500: {
                    readonly status: "error";
                    readonly message: "Internal server error";
                };
            };
        };
    };
} & {
    inventories: {
        report: {
            "total-items": {
                get: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Total items retrieved";
                            readonly data: {
                                readonly totalItems: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Total items retrieved";
                            readonly data: {
                                readonly totalItems: number;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        report: {
            "low-stock": {
                get: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Low stock items retrieved";
                            readonly data: {
                                id: string;
                                name: string;
                                stock: number;
                            }[];
                        } & {
                            readonly status: "success";
                            readonly message: "Low stock items retrieved";
                            readonly data: {
                                id: string;
                                name: string;
                                stock: number;
                            }[];
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        report: {
            usage: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from?: string | undefined;
                        to?: string | undefined;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Total usage retrieved";
                            readonly data: {
                                readonly totalUsage: number;
                                readonly from: string;
                                readonly to: string;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Total usage retrieved";
                            readonly data: {
                                readonly totalUsage: number;
                                readonly from: string;
                                readonly to: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        report: {
            "average-usage": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from?: string | undefined;
                        to?: string | undefined;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Average usage per order retrieved";
                            readonly data: {
                                readonly averageUsagePerOrder: number;
                                readonly from: string;
                                readonly to: string;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Average usage per order retrieved";
                            readonly data: {
                                readonly averageUsagePerOrder: number;
                                readonly from: string;
                                readonly to: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string | null;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            deletedAt: string | null;
                            stock: number;
                            safetyStock: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string | null;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            deletedAt: string | null;
                            stock: number;
                            safetyStock: number;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    inventories: {
        adjustments: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    inventoryIds?: string[] | undefined;
                    from?: string | undefined;
                    to?: string | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory history retrieved";
                        readonly data: {
                            total: number;
                            inventoryHistory: {
                                id: string;
                                inventoryId: string | null;
                                name: string | null;
                                change: number;
                                stockRemaining: number;
                                note: string | null;
                                userId: string;
                                user: string | null;
                                createdAt: string;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory history retrieved";
                        readonly data: {
                            total: number;
                            inventoryHistory: {
                                id: string;
                                inventoryId: string | null;
                                name: string | null;
                                change: number;
                                stockRemaining: number;
                                note: string | null;
                                userId: string;
                                user: string | null;
                                createdAt: string;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    inventories: {
        usage: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    inventoryIds?: string[] | undefined;
                    from?: string | undefined;
                    to?: string | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Usage history retrieved";
                        readonly data: {
                            total: number;
                            inventoryUsageHistory: {
                                id: string;
                                inventoryId: string | null;
                                orderId: string | null;
                                name: string | null;
                                change: number;
                                user: string | null;
                                stockRemaining: number;
                                createdAt: string;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Usage history retrieved";
                        readonly data: {
                            total: number;
                            inventoryUsageHistory: {
                                id: string;
                                inventoryId: string | null;
                                orderId: string | null;
                                name: string | null;
                                change: number;
                                user: string | null;
                                stockRemaining: number;
                                createdAt: string;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    inventories: {
        "restock-history": {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    inventoryIds?: string[] | undefined;
                    from?: string | undefined;
                    to?: string | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Restock history retrieved";
                        readonly data: {
                            total: number;
                            restockHistory: {
                                id: string;
                                inventoryId: string;
                                inventoryName: string | null;
                                restockQuantity: number;
                                stockRemaining: number;
                                supplier: string;
                                note: string | null;
                                userId: string;
                                actorName: string | null;
                                restockTime: Date;
                                createdAt: string;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Restock history retrieved";
                        readonly data: {
                            total: number;
                            restockHistory: {
                                id: string;
                                inventoryId: string;
                                inventoryName: string | null;
                                restockQuantity: number;
                                stockRemaining: number;
                                supplier: string;
                                note: string | null;
                                userId: string;
                                actorName: string | null;
                                restockTime: Date;
                                createdAt: string;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    inventories: {
        options: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory options retrieved";
                        readonly data: {
                            value: string;
                            label: string;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory options retrieved";
                        readonly data: {
                            value: string;
                            label: string;
                        }[];
                    };
                };
            };
        };
    };
} & {
    inventories: {
        post: {
            body: {
                name: string;
                image: File;
                description: string;
                price: number;
                stock: number;
                safetyStock: number;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                400: {
                    readonly status: "error";
                    readonly message: "Failed to create inventory";
                };
                201: {
                    readonly status: "success";
                    readonly message: "New inventory Created";
                    readonly data: {
                        id: string;
                        name: string;
                        image: string;
                        createdAt: string | null;
                        updatedAt: string | null;
                        description: string;
                        price: number;
                        deletedAt: string | null;
                        stock: number;
                        safetyStock: number;
                    } | undefined;
                };
                500: {
                    readonly status: "error";
                    readonly message: "Internal server error";
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            patch: {
                body: {
                    name: string;
                    description: string;
                    price: number;
                    safetyStock: number;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory Updated";
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory Updated";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    404: {
                        readonly status: "error";
                        readonly message: "Inventory not found";
                    };
                    500: {
                        readonly status: "error";
                        readonly message: "Internal server error";
                    };
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            image: {
                patch: {
                    body: {
                        image: File;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "inventory updated";
                        } & {
                            readonly status: "success";
                            readonly message: "inventory updated";
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        404: {
                            readonly status: "error";
                            readonly message: "inventory not found";
                        };
                        500: {
                            readonly status: "error";
                            readonly message: "Internal server error";
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            stock: {
                patch: {
                    body: {
                        note?: string | undefined;
                        changeAmount: number;
                        adjustmentTime: Date;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Quantity Updated";
                        } & {
                            readonly status: "success";
                            readonly message: "Quantity Updated";
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            restock: {
                post: {
                    body: {
                        note?: string | undefined;
                        supplier: string;
                        restockQuantity: number;
                        restockTime: Date;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Inventory restocked successfully";
                        } & {
                            readonly status: "success";
                            readonly message: "Inventory restocked successfully";
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    inventories: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory deleted";
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory deleted";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    404: {
                        readonly status: "error";
                        readonly message: "Inventory not found";
                    };
                    500: {
                        readonly status: "error";
                        readonly message: "Internal server error";
                    };
                };
            };
        };
    };
} & {
    members: {};
} & {
    members: {
        "search-by-phone": {
            get: {
                body: {};
                params: {};
                query: {
                    phone: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Member retrieved successfully";
                        readonly data: {
                            memberId: string;
                            name: string;
                            phoneNumber: string | null;
                            userId: string | null;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Member retrieved successfully";
                        readonly data: {
                            memberId: string;
                            name: string;
                            phoneNumber: string | null;
                            userId: string | null;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    404: {
                        readonly status: "error";
                        readonly message: "Member not found";
                    };
                };
            };
        };
    };
} & {
    members: {
        get: {
            body: {};
            params: {};
            query: {
                search?: string | undefined;
                rows?: number | undefined;
                page?: number | undefined;
            };
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Members Retrieved";
                    readonly data: {
                        members: {
                            id: string;
                            name: string;
                            userId: string | null;
                            phone: string | null;
                            points: number;
                            createdAt: string | null;
                        }[];
                        total: number;
                    };
                } & {
                    readonly status: "success";
                    readonly message: "Members Retrieved";
                    readonly data: {
                        members: {
                            id: string;
                            name: string;
                            userId: string | null;
                            phone: string | null;
                            points: number;
                            createdAt: string | null;
                        }[];
                        total: number;
                    };
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    members: {
        post: {
            body: {
                name: string;
                phone: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    readonly status: "success";
                    readonly message: "New Member Added";
                    readonly data: {
                        readonly id: string;
                    };
                };
            };
        };
    };
} & {
    members: {
        reports: {
            "total-customers": {
                get: {
                    body: {};
                    params: {};
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Total customers retrieved successfully";
                            readonly data: {
                                readonly totalCustomers: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Total customers retrieved successfully";
                            readonly data: {
                                readonly totalCustomers: number;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    members: {
        reports: {
            "average-order-value": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Average customer order retrieved successfully";
                            readonly data: {
                                readonly averageOrderValue: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Average customer order retrieved successfully";
                            readonly data: {
                                readonly averageOrderValue: number;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    members: {
        reports: {
            "active-members": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Active members retrieved successfully";
                            readonly data: {
                                readonly activeMembers: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Active members retrieved successfully";
                            readonly data: {
                                readonly activeMembers: number;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    members: {
        reports: {
            "total-member-orders": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Total member orders retrieved successfully";
                            readonly data: {
                                readonly totalMemberOrders: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Total member orders retrieved successfully";
                            readonly data: {
                                readonly totalMemberOrders: number;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    members: {
        reports: {
            "members-spending": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        search?: string | undefined;
                        rows?: number | undefined;
                        page?: number | undefined;
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Members spending data retrieved successfully";
                            readonly data: {
                                members: {
                                    totalSpending: string | number;
                                    orderCount: number;
                                    averageSpending: number;
                                    id: string;
                                    name: string;
                                    phone: string | null;
                                    joinDate: string | null;
                                }[];
                                total: number;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Members spending data retrieved successfully";
                            readonly data: {
                                members: {
                                    totalSpending: string | number;
                                    orderCount: number;
                                    averageSpending: number;
                                    id: string;
                                    name: string;
                                    phone: string | null;
                                    joinDate: string | null;
                                }[];
                                total: number;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    members: {
        points: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Member points retrieved successfully";
                        readonly data: {
                            readonly points: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Member points retrieved successfully";
                        readonly data: {
                            readonly points: number;
                        };
                    };
                };
            };
        };
    };
} & {
    services: {};
} & {
    services: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Services Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        image: string;
                        createdAt: string | null;
                        updatedAt: string | null;
                        description: string;
                        price: number;
                        deletedAt: string | null;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Services Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        image: string;
                        createdAt: string | null;
                        updatedAt: string | null;
                        description: string;
                        price: number;
                        deletedAt: string | null;
                    }[];
                };
            };
        };
    };
} & {
    services: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Service Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string | null;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            deletedAt: string | null;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Service Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string | null;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            deletedAt: string | null;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    services: {
        post: {
            body: {
                name: string;
                image: File;
                description: string;
                price: number;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    data: {
                        id: string;
                    };
                    status: "success";
                    message: string;
                };
            };
        };
    };
} & {
    services: {
        ":id": {
            patch: {
                body: {
                    name: string;
                    description: string;
                    price: number;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Service updated";
                    } & {
                        readonly status: "success";
                        readonly message: "Service updated";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    services: {
        ":id": {
            image: {
                patch: {
                    body: {
                        image: File;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Service updated";
                        } & {
                            readonly status: "success";
                            readonly message: "Service updated";
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    services: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Service deleted";
                    } & {
                        readonly status: "success";
                        readonly message: "Service deleted";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    vouchers: {};
} & {
    vouchers: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Vouchers Retrieved";
                    readonly data: {
                        id: string;
                        code: string;
                        description: string;
                        discountPercentage: string | null;
                        discountAmount: number | null;
                        minSpend: number;
                        maxDiscountAmount: number;
                        isVisible: boolean;
                        expiresAt: string | null;
                        createdAt: string | null;
                        deletedAt: string | null;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Vouchers Retrieved";
                    readonly data: {
                        id: string;
                        code: string;
                        description: string;
                        discountPercentage: string | null;
                        discountAmount: number | null;
                        minSpend: number;
                        maxDiscountAmount: number;
                        isVisible: boolean;
                        expiresAt: string | null;
                        createdAt: string | null;
                        deletedAt: string | null;
                    }[];
                };
            };
        };
    };
} & {
    vouchers: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory Retrieved";
                        readonly data: {
                            id: string;
                            createdAt: string | null;
                            expiresAt: string | null;
                            code: string;
                            description: string;
                            deletedAt: string | null;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            isVisible: boolean;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory Retrieved";
                        readonly data: {
                            id: string;
                            createdAt: string | null;
                            expiresAt: string | null;
                            code: string;
                            description: string;
                            deletedAt: string | null;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            isVisible: boolean;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    vouchers: {
        post: {
            body: {
                id?: string | undefined;
                createdAt?: string | null | undefined;
                expiresAt?: string | null | undefined;
                deletedAt?: string | null | undefined;
                discountPercentage?: string | null | undefined;
                discountAmount?: number | null | undefined;
                isVisible?: boolean | undefined;
                code: string;
                description: string;
                minSpend: number;
                maxDiscountAmount: number;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    readonly status: "success";
                    readonly message: "New Voucher Created";
                    readonly data: {
                        readonly id: string;
                    };
                };
            };
        };
    };
} & {
    vouchers: {
        ":id": {
            patch: {
                body: {
                    id?: string | undefined;
                    createdAt?: string | null | undefined;
                    expiresAt?: string | null | undefined;
                    deletedAt?: string | null | undefined;
                    discountPercentage?: string | null | undefined;
                    discountAmount?: number | null | undefined;
                    isVisible?: boolean | undefined;
                    code: string;
                    description: string;
                    minSpend: number;
                    maxDiscountAmount: number;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Voucher updated successfully";
                    } & {
                        readonly status: "success";
                        readonly message: "Voucher updated successfully";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    vouchers: {
        ":id": {
            delete: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Voucher deactivated successfully";
                    } & {
                        readonly status: "success";
                        readonly message: "Voucher deactivated successfully";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    bundlings: {};
} & {
    bundlings: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Bundlings Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        image: string;
                        createdAt: string;
                        updatedAt: string | null;
                        description: string;
                        price: number;
                        isActive: boolean | null;
                        deletedAt: string | null;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Bundlings Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        image: string;
                        createdAt: string;
                        updatedAt: string | null;
                        description: string;
                        price: number;
                        isActive: boolean | null;
                        deletedAt: string | null;
                    }[];
                };
                500: {
                    readonly status: "error";
                    readonly message: "Internal server error";
                };
            };
        };
    };
} & {
    bundlings: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Bundling Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            isActive: boolean | null;
                            deletedAt: string | null;
                            items: {
                                id: string;
                                bundlingId: string;
                                itemType: "service" | "inventory";
                                serviceId: string | null;
                                inventoryId: string | null;
                                quantity: number;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Bundling Retrieved";
                        readonly data: {
                            id: string;
                            name: string;
                            image: string;
                            createdAt: string;
                            updatedAt: string | null;
                            description: string;
                            price: number;
                            isActive: boolean | null;
                            deletedAt: string | null;
                            items: {
                                id: string;
                                bundlingId: string;
                                itemType: "service" | "inventory";
                                serviceId: string | null;
                                inventoryId: string | null;
                                quantity: number;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    404: {
                        readonly status: "error";
                        readonly message: "Inventory not found";
                    };
                    500: {
                        readonly status: "error";
                        readonly message: "Internal server error";
                    };
                };
            };
        };
    };
} & {
    bundlings: {
        post: {
            body: {
                name: string;
                image: File;
                description: string;
                price: number;
                items: {
                    serviceId?: string | null | undefined;
                    inventoryId?: string | null | undefined;
                    itemType: "service" | "inventory";
                    quantity: number;
                }[];
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    readonly status: "success";
                    readonly message: "New Bundling Created";
                    readonly data: {
                        readonly bundlingId: string;
                    };
                };
            };
        };
    };
} & {
    bundlings: {
        ":id": {
            patch: {
                body: {
                    name: string;
                    description: string;
                    price: number;
                };
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Bundling data Updated";
                    } & {
                        readonly status: "success";
                        readonly message: "Bundling data Updated";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    404: {
                        readonly status: "error";
                        readonly message: "Inventory not found";
                    };
                    500: {
                        readonly status: "error";
                        readonly message: "Internal server error";
                    };
                };
            };
        };
    };
} & {
    bundlings: {
        ":id": {
            items: {
                patch: {
                    body: {
                        id?: string | null | undefined;
                        bundlingId?: string | null | undefined;
                        serviceId?: string | null | undefined;
                        inventoryId?: string | null | undefined;
                        itemType: "service" | "inventory";
                        quantity: number;
                    }[];
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Bundling Items Updated.";
                            readonly data: {
                                readonly id: string;
                                readonly body: {
                                    id?: string | null | undefined;
                                    bundlingId?: string | null | undefined;
                                    serviceId?: string | null | undefined;
                                    inventoryId?: string | null | undefined;
                                    itemType: "service" | "inventory";
                                    quantity: number;
                                }[];
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Bundling Items Updated.";
                            readonly data: {
                                readonly id: string;
                                readonly body: {
                                    id?: string | null | undefined;
                                    bundlingId?: string | null | undefined;
                                    serviceId?: string | null | undefined;
                                    inventoryId?: string | null | undefined;
                                    itemType: "service" | "inventory";
                                    quantity: number;
                                }[];
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    bundlings: {
        ":id": {
            image: {
                patch: {
                    body: {
                        image: File;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Bundling image updated";
                        } & {
                            readonly status: "success";
                            readonly message: "Bundling image updated";
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        404: {
                            readonly status: "error";
                            readonly message: "inventory not found";
                        };
                        500: {
                            readonly status: "error";
                            readonly message: "Internal server error";
                        };
                    };
                };
            };
        };
    };
} & {
    staffs: {};
} & {
    staffs: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Services Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        phoneNumber: string | null;
                        role: "user" | "superadmin" | "admin" | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Services Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        phoneNumber: string | null;
                        role: "user" | "superadmin" | "admin" | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                    }[];
                };
            };
        };
    };
} & {
    pos: {};
} & {
    pos: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Pos Items Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        description: string;
                        price: number;
                        image: string;
                        stock: number | null;
                        itemType: string;
                    }[];
                } & {
                    readonly status: "success";
                    readonly message: "Pos Items Retrieved";
                    readonly data: {
                        id: string;
                        name: string;
                        description: string;
                        price: number;
                        image: string;
                        stock: number | null;
                        itemType: string;
                    }[];
                };
            };
        };
    };
} & {
    pos: {
        new: {
            post: {
                body: {
                    phone?: string | null | undefined;
                    points?: number | null | undefined;
                    memberId?: string | null | undefined;
                    newMember?: boolean | null | undefined;
                    customerName: string;
                    paymentType: "cash";
                    amountPaid: number;
                    items: {
                        bundlingId?: string | null | undefined;
                        serviceId?: string | null | undefined;
                        inventoryId?: string | null | undefined;
                        note?: string | null | undefined;
                        voucherId?: string | null | undefined;
                        itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                        quantity: number;
                    }[];
                } | {
                    phone?: string | null | undefined;
                    points?: number | null | undefined;
                    memberId?: string | null | undefined;
                    newMember?: boolean | null | undefined;
                    customerName: string;
                    paymentType: "qris";
                    items: {
                        bundlingId?: string | null | undefined;
                        serviceId?: string | null | undefined;
                        inventoryId?: string | null | undefined;
                        note?: string | null | undefined;
                        voucherId?: string | null | undefined;
                        itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                        quantity: number;
                    }[];
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "New Pos Order Created";
                        readonly data: {
                            readonly orderId: string;
                        };
                    };
                };
            };
        };
    };
} & {
    pos: {
        members: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Member search success";
                        readonly data: {
                            readonly members: {
                                id: string;
                                name: string;
                                phone: string;
                                points: number;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Member search success";
                        readonly data: {
                            readonly members: {
                                id: string;
                                name: string;
                                phone: string;
                                points: number;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    pos: {
        vouchers: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Pos Vouchers Retrieved";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            expiresAt: string | null;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Pos Vouchers Retrieved";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            expiresAt: string | null;
                        }[];
                    };
                };
            };
        };
    };
} & {
    pos: {
        voucher: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Voucher Added";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            expiresAt: string | null;
                        } | undefined;
                    } & {
                        readonly status: "success";
                        readonly message: "Voucher Added";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            expiresAt: string | null;
                        } | undefined;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    orders: {};
} & {
    orders: {
        payment: {
            ":id": {
                subscribe: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        notification: {
            post: {
                body: {
                    acquirer?: string | undefined;
                    settlement_time?: string | undefined;
                    merchant_cross_reference_id?: string | undefined;
                    issuer?: string | undefined;
                    order_id: string;
                    transaction_status: "pending" | "capture" | "settlement" | "deny" | "expire" | "cancel";
                    transaction_time: string;
                    fraud_status: "pending" | "deny" | "accept";
                    expiry_time: string;
                    transaction_type: "on-us" | "off-us";
                    transaction_id: string;
                    status_message: string;
                    status_code: string;
                    signature_key: string;
                    pop_id: string;
                    payment_type: "qris" | "gopay" | "bank_transfer" | "credit_card";
                    merchant_id: string;
                    gross_amount: string;
                    customer_details: {
                        [x: string]: any;
                    };
                    currency: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Notification Received";
                        readonly data: {
                            updated: boolean;
                            result: null;
                            message: string;
                        } | {
                            updated: boolean;
                            result: {
                                transactionStatus: string;
                                updatedAt: string;
                            };
                            message: string;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Notification Received";
                        readonly data: {
                            updated: boolean;
                            result: null;
                            message: string;
                        } | {
                            updated: boolean;
                            result: {
                                transactionStatus: string;
                                updatedAt: string;
                            };
                            message: string;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    orders: {
        get: {
            body: {};
            params: {};
            query: {
                search?: string | undefined;
                rows?: number | undefined;
                page?: number | undefined;
            };
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Orders Retrieved";
                    readonly data: {
                        orders: {
                            id: string;
                            customerName: string | null;
                            phone: string | null;
                            total: number | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                            totalItems: number;
                            createdAt: string;
                        }[];
                        total: number;
                    };
                } & {
                    readonly status: "success";
                    readonly message: "Orders Retrieved";
                    readonly data: {
                        orders: {
                            id: string;
                            customerName: string | null;
                            phone: string | null;
                            total: number | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                            totalItems: number;
                            createdAt: string;
                        }[];
                        total: number;
                    };
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            status: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Status Retrieved";
                            readonly data: {
                                status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                                createdAt: string;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Status Retrieved";
                            readonly data: {
                                status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                                createdAt: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            status: {
                patch: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Status Updated";
                            readonly data: {
                                id: string;
                                oldStatus: "processing" | "ready";
                                newStatus: "processing" | "ready";
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Status Updated";
                            readonly data: {
                                id: string;
                                oldStatus: "processing" | "ready";
                                newStatus: "processing" | "ready";
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            items: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Items Retrieved";
                            readonly data: {
                                items: {
                                    id: string;
                                    itemtype: "service" | "inventory" | "points" | "bundling" | "voucher";
                                    quantity: number;
                                    subtotal: number;
                                    note: string | null;
                                    name: string;
                                    description: string;
                                    price: number;
                                }[];
                                voucher: {
                                    id: string;
                                    code: string;
                                    description: string;
                                    discountAmount: number;
                                } | undefined;
                                points: {
                                    id: string;
                                    points: number;
                                } | undefined;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Items Retrieved";
                            readonly data: {
                                items: {
                                    id: string;
                                    itemtype: "service" | "inventory" | "points" | "bundling" | "voucher";
                                    quantity: number;
                                    subtotal: number;
                                    note: string | null;
                                    name: string;
                                    description: string;
                                    price: number;
                                }[];
                                voucher: {
                                    id: string;
                                    code: string;
                                    description: string;
                                    discountAmount: number;
                                } | undefined;
                                points: {
                                    id: string;
                                    points: number;
                                } | undefined;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            payment: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Payment Retrieved";
                            readonly data: {
                                paymentType: "qris" | "cash" | null;
                                amountPaid: number;
                                change: number | null;
                                transactionStatus: string;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Payment Retrieved";
                            readonly data: {
                                paymentType: "qris" | "cash" | null;
                                amountPaid: number;
                                change: number | null;
                                transactionStatus: string;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            customer: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Customer Retrieved";
                            readonly data: {
                                name: string | null;
                                phone: string | null;
                                memberId: string | null;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Customer Retrieved";
                            readonly data: {
                                name: string | null;
                                phone: string | null;
                                memberId: string | null;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            deliveries: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Deliveries Retrieved";
                            readonly data: {
                                id: string;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                address: string | null;
                                label: string | null;
                                note: string | null;
                            }[];
                        } & {
                            readonly status: "success";
                            readonly message: "Order Deliveries Retrieved";
                            readonly data: {
                                id: string;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                address: string | null;
                                label: string | null;
                                note: string | null;
                            }[];
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    orders: {
        ":id": {
            payment_details: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Payment Details Retrieved";
                            readonly data: {
                                id: string;
                                orderId: string;
                                paymentType: "qris" | "cash" | null;
                                discountAmount: number;
                                amountPaid: number;
                                change: number | null;
                                total: number;
                                transactionStatus: string;
                                fraudStatus: string | null;
                                qrString: string | null;
                                acquirer: string | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                                transactionTime: string;
                                expiryTime: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Payment Details Retrieved";
                            readonly data: {
                                id: string;
                                orderId: string;
                                paymentType: "qris" | "cash" | null;
                                discountAmount: number;
                                amountPaid: number;
                                change: number | null;
                                total: number;
                                transactionStatus: string;
                                fraudStatus: string | null;
                                qrString: string | null;
                                acquirer: string | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                                transactionTime: string;
                                expiryTime: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    receipt: {
        lookup: {
            get: {
                body: unknown;
                params: {};
                query: {
                    orderId: string;
                };
                headers: unknown;
                response: {
                    200: {
                        status: string;
                        data: {
                            orderId: string;
                            exists: boolean;
                            customerName: null;
                            createdAt: null;
                            status: null;
                        } | {
                            orderId: string;
                            exists: boolean;
                            customerName: string | null;
                            createdAt: string;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    receipt: {
        ":id": {
            info: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            data: {
                                status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                                createdAt: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    receipt: {
        ":id": {
            customer: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            data: {
                                name: string;
                                phone: string;
                                memberId: string | null;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    receipt: {
        ":id": {
            deliveries: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            data: {
                                id: string;
                                address: string;
                                courier: string;
                                trackingNumber: null;
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            }[];
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    receipt: {
        ":id": {
            payment: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            data: {
                                paymentType: string;
                                amountPaid: number;
                                change: number;
                                transactionStatus: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    receipt: {
        ":id": {
            items: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: string;
                            data: {
                                items: {
                                    id: string;
                                    name: string;
                                    qty: number;
                                    price: number;
                                    subtotal: number;
                                }[];
                                voucher: {
                                    id: string;
                                    code: string;
                                    description: string;
                                    discountAmount: number;
                                } | null;
                                points: {
                                    id: string;
                                    points: number;
                                } | null;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    sales: {};
} & {
    sales: {
        "net-revenue": {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Net revenue calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Net revenue calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        "gross-revenue": {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Gross revenue calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Gross revenue calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        count: {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Transaction count retrieved";
                        readonly data: {
                            readonly count: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Transaction count retrieved";
                        readonly data: {
                            readonly count: number;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        "average-value": {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Average order value calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Average order value calculated";
                        readonly data: {
                            readonly value: number;
                            readonly currency: "IDR";
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        scorecard: {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Scorecard data retrieved";
                        readonly data: {
                            netRevenue: number;
                            grossRevenue: number;
                            transactionCount: number;
                            avgOrderValue: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Scorecard data retrieved";
                        readonly data: {
                            netRevenue: number;
                            grossRevenue: number;
                            transactionCount: number;
                            avgOrderValue: number;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        chart: {
            get: {
                body: {};
                params: {};
                query: {
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Chart data retrieved";
                        readonly data: {
                            date: string;
                            net: number;
                            discount: number;
                            gross: number;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Chart data retrieved";
                        readonly data: {
                            date: string;
                            net: number;
                            discount: number;
                            gross: number;
                        }[];
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        "best-sellers": {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    item_type?: string | string[] | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    item_id?: string | string[] | undefined;
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Best sellers retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                itemName: string;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                price: number;
                                totalUnitsSold: number;
                                transactionCount: number;
                                totalRevenue: number;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Best sellers retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                itemName: string;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                price: number;
                                totalUnitsSold: number;
                                transactionCount: number;
                                totalRevenue: number;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        "item-options": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Order item options retrieved";
                        readonly data: {
                            value: string;
                            label: string;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Order item options retrieved";
                        readonly data: {
                            value: string;
                            label: string;
                        }[];
                    };
                };
            };
        };
    };
} & {
    sales: {
        "by-orders": {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    payment_type?: string | string[] | null | undefined;
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Sales data by order retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                totalItems: number;
                                paymentType: "qris" | "cash" | null;
                                itemsTotal: unknown;
                                discountAmount: number;
                                total: number;
                                amountPaid: number;
                                change: number | null;
                                createdAt: string;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Sales data by order retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                totalItems: number;
                                paymentType: "qris" | "cash" | null;
                                itemsTotal: unknown;
                                discountAmount: number;
                                total: number;
                                amountPaid: number;
                                change: number | null;
                                createdAt: string;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    sales: {
        "item-logs": {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    item_type?: string | string[] | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                    item_id?: string | string[] | undefined;
                    from: string;
                    to: string;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Item logs retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                orderId: string;
                                itemName: string;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                quantity: number;
                                createdAt: string;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Item logs retrieved";
                        readonly data: {
                            items: {
                                id: string;
                                orderId: string;
                                itemName: string;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                quantity: number;
                                createdAt: string;
                            }[];
                            meta: {
                                total: number;
                                page: number;
                                rows: number;
                                totalPages: number;
                            };
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {};
} & {
    users: {
        post: {
            body: {
                memberId?: string | null | undefined;
                username: string;
                password: string;
                name: string;
                email: string;
                phoneNumber: string;
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    readonly status: "success";
                    readonly message: "User registered successfully";
                    readonly data: {
                        readonly newUserId: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        cashier: {
            post: {
                body: {
                    username: string;
                    name: string;
                    email: string;
                    phoneNumber: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "Cashier created successfully";
                        readonly data: {
                            readonly newUserId: string;
                        };
                    };
                };
            };
        };
    };
} & {
    users: {
        get: {
            body: {};
            params: {};
            query: {
                search?: string | undefined;
                rows?: number | undefined;
                page?: number | undefined;
            };
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Users retrieved";
                    readonly data: {
                        users: {
                            id: string;
                            name: string;
                            email: string;
                            phone: string | null;
                            image: string | null;
                            username: string | null;
                            role: "user" | "superadmin" | "admin" | null;
                        }[];
                        total: number;
                    };
                } & {
                    readonly status: "success";
                    readonly message: "Users retrieved";
                    readonly data: {
                        users: {
                            id: string;
                            name: string;
                            email: string;
                            phone: string | null;
                            image: string | null;
                            username: string | null;
                            role: "user" | "superadmin" | "admin" | null;
                        }[];
                        total: number;
                    };
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    users: {
        "connect-member": {
            post: {
                body: {
                    phoneNumber: string;
                    memberId: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Member connected successfully";
                    } & {
                        readonly status: "success";
                        readonly message: "Member connected successfully";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    users: {
        "create-member": {
            post: {
                body: {
                    name: string;
                    phoneNumber: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "Member created successfully";
                    };
                };
            };
        };
    };
} & {
    customerorders: {};
} & {
    customerorders: {
        get: {
            body: {};
            params: {};
            query: {
                page?: number | undefined;
            };
            headers: {};
            response: {
                200: {
                    readonly status: 200;
                    readonly message: "Customer orders fetched successfully";
                    readonly data: {
                        id: string;
                        createdAt: string;
                        total: number | null;
                        status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                    }[];
                    readonly totalData: number;
                    readonly totalPages: number;
                } & {
                    readonly status: 200;
                    readonly message: "Customer orders fetched successfully";
                    readonly data: {
                        id: string;
                        createdAt: string;
                        total: number | null;
                        status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                    }[];
                    readonly totalData: number;
                    readonly totalPages: number;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    customerorders: {
        "request-pickup": {
            post: {
                body: {
                    points?: number | null | undefined;
                    addressId: string;
                    items: {
                        bundlingId?: string | null | undefined;
                        serviceId?: string | null | undefined;
                        inventoryId?: string | null | undefined;
                        note?: string | null | undefined;
                        voucherId?: string | null | undefined;
                        itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                        quantity: number;
                    }[];
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "Pickup request submitted successfully";
                        readonly data: {
                            readonly orderId: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        "request-delivery": {
            post: {
                body: {
                    addressId: string;
                    orderId: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "Delivery request submitted successfully";
                        readonly data: {
                            readonly deliveryId: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            detail: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: 200;
                            readonly message: "Order detail fetched successfully";
                            readonly data: {
                                status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                                createdAt: string;
                            };
                        } & {
                            readonly status: 200;
                            readonly message: "Order detail fetched successfully";
                            readonly data: {
                                status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                                createdAt: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            items: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: 200;
                            readonly message: "Order items fetched successfully";
                            readonly data: {
                                id: string;
                                quantity: number;
                                subtotal: number;
                                note: string | null;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                name: string;
                                price: number;
                            }[];
                        } & {
                            readonly status: 200;
                            readonly message: "Order items fetched successfully";
                            readonly data: {
                                id: string;
                                quantity: number;
                                subtotal: number;
                                note: string | null;
                                itemType: "service" | "inventory" | "points" | "bundling" | "voucher";
                                name: string;
                                price: number;
                            }[];
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            payment: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: 200;
                            readonly message: "Order payment fetched successfully";
                            readonly data: {
                                status: string;
                                method: "qris" | "cash" | null;
                                total: number;
                                amountPaid: number;
                                change: number | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                            };
                        } & {
                            readonly status: 200;
                            readonly message: "Order payment fetched successfully";
                            readonly data: {
                                status: string;
                                method: "qris" | "cash" | null;
                                total: number;
                                amountPaid: number;
                                change: number | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            payment: {
                post: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: 201;
                            readonly message: "QRIS Payment Created";
                            readonly data: void;
                        } & {
                            readonly status: 201;
                            readonly message: "QRIS Payment Created";
                            readonly data: void;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            delivery: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: 200;
                            readonly message: "Order delivery fetched successfully";
                            readonly data: {
                                id: string;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                address: string | null;
                                label: string | null;
                                notes: string | null;
                            }[];
                        } & {
                            readonly status: 200;
                            readonly message: "Order delivery fetched successfully";
                            readonly data: {
                                id: string;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                address: string | null;
                                label: string | null;
                                notes: string | null;
                            }[];
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            patch: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: 200;
                        readonly message: "Order cancelled successfully";
                        readonly data: {
                            delivery: {
                                id: string;
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            };
                            id: string;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        };
                    } & {
                        readonly status: 200;
                        readonly message: "Order cancelled successfully";
                        readonly data: {
                            delivery: {
                                id: string;
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            };
                            id: string;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    customerorders: {
        ":id": {
            payment_details: {
                get: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Order Payment Details Retrieved";
                            readonly data: {
                                id: string;
                                orderId: string;
                                paymentType: "qris" | "cash" | null;
                                discountAmount: number;
                                amountPaid: number;
                                change: number | null;
                                total: number;
                                transactionStatus: string;
                                fraudStatus: string | null;
                                qrString: string | null;
                                acquirer: string | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                                transactionTime: string;
                                expiryTime: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Order Payment Details Retrieved";
                            readonly data: {
                                id: string;
                                orderId: string;
                                paymentType: "qris" | "cash" | null;
                                discountAmount: number;
                                amountPaid: number;
                                change: number | null;
                                total: number;
                                transactionStatus: string;
                                fraudStatus: string | null;
                                qrString: string | null;
                                acquirer: string | null;
                                actions: {
                                    name: string;
                                    method: string;
                                    url: string;
                                }[] | null;
                                transactionTime: string;
                                expiryTime: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    account: {};
} & {
    account: {
        info: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Account info retrieved successfully";
                        readonly data: {
                            id: string;
                            name: string;
                            email: string;
                            username: string | null;
                            phone: string | null;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Account info retrieved successfully";
                        readonly data: {
                            id: string;
                            name: string;
                            email: string;
                            username: string | null;
                            phone: string | null;
                        };
                    };
                };
            };
        };
    };
} & {
    account: {
        get: {
            body: {};
            params: {};
            query: {};
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "User role retrieved successfully";
                    readonly data: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        phoneNumber: string | null;
                        role: "user" | "superadmin" | "admin" | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                    };
                } & {
                    readonly status: "success";
                    readonly message: "User role retrieved successfully";
                    readonly data: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        image: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        username: string | null;
                        displayUsername: string | null;
                        phoneNumber: string | null;
                        role: "user" | "superadmin" | "admin" | null;
                        banned: boolean | null;
                        banReason: string | null;
                        banExpires: Date | null;
                    };
                };
            };
        };
    };
} & {
    account: {
        info: {
            patch: {
                body: {
                    username: string;
                    name: string;
                    email: string;
                    phone: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Account info updated successfully";
                        readonly data: string;
                    } & {
                        readonly status: "success";
                        readonly message: "Account info updated successfully";
                        readonly data: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    account: {
        password: {
            patch: {
                body: {
                    newPassword: string;
                    currentPassword: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Password updated successfully";
                        readonly data: {
                            token: string | null;
                            user: {
                                id: string;
                                email: string;
                                name: string;
                                image: string | null | undefined;
                                emailVerified: boolean;
                                createdAt: Date;
                                updatedAt: Date;
                            };
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Password updated successfully";
                        readonly data: {
                            token: string | null;
                            user: {
                                id: string;
                                email: string;
                                name: string;
                                image: string | null | undefined;
                                emailVerified: boolean;
                                createdAt: Date;
                                updatedAt: Date;
                            };
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    account: {
        phone: {
            post: {
                body: {
                    phoneNumber: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Phone number updated";
                    } & {
                        readonly status: "success";
                        readonly message: "Phone number updated";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    account: {
        address: {
            post: {
                body: {
                    label: string;
                    note: string | null;
                    street: string;
                    lat: number;
                    lng: number;
                };
                params: {};
                query: {};
                headers: {};
                response: {
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                    201: {
                        readonly status: "success";
                        readonly message: "Address added successfully";
                        readonly data: {
                            id: string;
                        };
                    };
                };
            };
        };
    };
} & {
    account: {
        addresses: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Addresses retrieved successfully";
                        readonly data: {
                            id: string;
                            label: string;
                            street: string;
                            lat: number;
                            lng: number;
                            note: string | null;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Addresses retrieved successfully";
                        readonly data: {
                            id: string;
                            label: string;
                            street: string;
                            lat: number;
                            lng: number;
                            note: string | null;
                        }[];
                    };
                };
            };
        };
    };
} & {
    account: {
        address: {
            ":id": {
                delete: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Address deleted successfully";
                            readonly data: {
                                id: string;
                            } | undefined;
                        } & {
                            readonly status: "success";
                            readonly message: "Address deleted successfully";
                            readonly data: {
                                id: string;
                            } | undefined;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    account: {
        address: {
            ":id": {
                patch: {
                    body: {
                        label?: string | undefined;
                        note?: string | undefined;
                        street?: string | undefined;
                        lat?: number | undefined;
                        lng?: number | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Address updated successfully";
                            readonly data: {
                                id: string;
                                label: string;
                                street: string;
                                lat: number;
                                lng: number;
                                note: string | null;
                            } | undefined;
                        } & {
                            readonly status: "success";
                            readonly message: "Address updated successfully";
                            readonly data: {
                                id: string;
                                label: string;
                                street: string;
                                lat: number;
                                lng: number;
                                note: string | null;
                            } | undefined;
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    "customer-dashboard": {};
} & {
    "customer-dashboard": {
        customer: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Customer info retrieved successfully";
                        readonly data: {
                            name: string;
                            phone: string | null;
                            points: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Customer info retrieved successfully";
                        readonly data: {
                            name: string;
                            phone: string | null;
                            points: number;
                        };
                    };
                };
            };
        };
    };
} & {
    "customer-dashboard": {
        orders: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: 200;
                        readonly message: "Dashboard orders retrieved successfully";
                        readonly data: {
                            id: string;
                            createdAt: string;
                            total: number | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        }[];
                    } & {
                        readonly status: 200;
                        readonly message: "Dashboard orders retrieved successfully";
                        readonly data: {
                            id: string;
                            createdAt: string;
                            total: number | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        }[];
                    };
                };
            };
        };
    };
} & {
    "customer-dashboard": {
        deliveries: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Dashboard deliveries retrieved successfully";
                        readonly data: {
                            date: string;
                            id: string;
                            type: "pickup" | "delivery";
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            address: string;
                            orderId: string;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Dashboard deliveries retrieved successfully";
                        readonly data: {
                            date: string;
                            id: string;
                            type: "pickup" | "delivery";
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            address: string;
                            orderId: string;
                        }[];
                    };
                };
            };
        };
    };
} & {
    "customer-dashboard": {
        vouchers: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Available vouchers retrieved";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            isVisible: boolean;
                            expiresAt: string | null;
                            createdAt: string | null;
                            deletedAt: string | null;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Available vouchers retrieved";
                        readonly data: {
                            id: string;
                            code: string;
                            description: string;
                            discountPercentage: string | null;
                            discountAmount: number | null;
                            minSpend: number;
                            maxDiscountAmount: number;
                            isVisible: boolean;
                            expiresAt: string | null;
                            createdAt: string | null;
                            deletedAt: string | null;
                        }[];
                    };
                };
            };
        };
    };
} & {
    "customer-deliveries": {};
} & {
    "customer-deliveries": {
        get: {
            body: {};
            params: {};
            query: {
                page?: number | undefined;
            };
            headers: {};
            response: {
                200: {
                    readonly status: "success";
                    readonly message: "Deliveries retrieved successfully";
                    readonly data: {
                        address: string;
                        date: string;
                        id: string;
                        orderId: string;
                        type: "pickup" | "delivery";
                        status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                    }[];
                    readonly totalData: number;
                    readonly totalPages: number;
                } & {
                    readonly status: "success";
                    readonly message: "Deliveries retrieved successfully";
                    readonly data: {
                        address: string;
                        date: string;
                        id: string;
                        orderId: string;
                        type: "pickup" | "delivery";
                        status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                    }[];
                    readonly totalData: number;
                    readonly totalPages: number;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    "customer-deliveries": {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Delivery retrieved successfully";
                        readonly data: {
                            id: string;
                            type: "pickup" | "delivery";
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            address: string;
                            latitude: string | null;
                            longitude: string | null;
                            notes: string | null;
                            orderId: string;
                            requestedAt: string;
                            completedAt: string | null;
                            addressLabel: string | null;
                            addressNotes: string | null;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Delivery retrieved successfully";
                        readonly data: {
                            id: string;
                            type: "pickup" | "delivery";
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                            address: string;
                            latitude: string | null;
                            longitude: string | null;
                            notes: string | null;
                            orderId: string;
                            requestedAt: string;
                            completedAt: string | null;
                            addressLabel: string | null;
                            addressNotes: string | null;
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    deliveries: {};
} & {
    deliveries: {
        post: {
            body: {
                deliveryIds: string[];
            };
            params: {};
            query: {};
            headers: {};
            response: {
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
                201: {
                    readonly status: "success";
                    readonly message: "New pickup route created";
                    readonly data: {
                        readonly routeId: string;
                    };
                };
            };
        };
    };
} & {
    deliveries: {
        pickups: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    status?: "cancelled" | "completed" | "requested" | "in_progress" | "assigned" | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Pickups retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            orderId: string;
                            routeId: string | null;
                            addressId: string;
                            customerName: string;
                            customerPhone: string | null;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                        readonly totalData: number;
                        readonly totalPages: number;
                    } & {
                        readonly status: "success";
                        readonly message: "Pickups retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            orderId: string;
                            routeId: string | null;
                            addressId: string;
                            customerName: string;
                            customerPhone: string | null;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                        readonly totalData: number;
                        readonly totalPages: number;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    deliveries: {
        deliveries: {
            get: {
                body: {};
                params: {};
                query: {
                    search?: string | undefined;
                    status?: "cancelled" | "completed" | "requested" | "in_progress" | "assigned" | undefined;
                    rows?: number | undefined;
                    page?: number | undefined;
                };
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Deliveries retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            orderId: string;
                            routeId: string | null;
                            addressId: string;
                            customerName: string;
                            customerPhone: string | null;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                        readonly totalData: number;
                        readonly totalPages: number;
                    } & {
                        readonly status: "success";
                        readonly message: "Deliveries retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            orderId: string;
                            routeId: string | null;
                            addressId: string;
                            customerName: string;
                            customerPhone: string | null;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                        readonly totalData: number;
                        readonly totalPages: number;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    deliveries: {
        ":id": {
            status: {
                patch: {
                    body: {};
                    params: {
                        id: string;
                    };
                    query: {};
                    headers: {};
                    response: {
                        200: {
                            readonly status: "success";
                            readonly message: "Delivery Status Updated";
                            readonly data: {
                                id: string;
                                oldStatus: "in_progress" | "picked_up";
                                newStatus: "in_progress" | "picked_up";
                            };
                        } & {
                            readonly status: "success";
                            readonly message: "Delivery Status Updated";
                            readonly data: {
                                id: string;
                                oldStatus: "in_progress" | "picked_up";
                                newStatus: "in_progress" | "picked_up";
                            };
                        };
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    routes: {};
} & {
    routes: {
        ":id": {
            get: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Route retrieved successfully";
                        readonly data: {
                            id: string;
                            userId: string | null;
                            deliveries: {
                                id: string;
                                orderId: string;
                                addressId: string;
                                index: number | null;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                notes: string | null;
                                requestedAt: string | null;
                                completedAt: string | null;
                                customerName: string;
                                customerPhone: string | null;
                                addressLabel: string;
                                address: string;
                                latitude: string;
                                longitude: string;
                            }[];
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Route retrieved successfully";
                        readonly data: {
                            id: string;
                            userId: string | null;
                            deliveries: {
                                id: string;
                                orderId: string;
                                addressId: string;
                                index: number | null;
                                type: "pickup" | "delivery";
                                status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                                notes: string | null;
                                requestedAt: string | null;
                                completedAt: string | null;
                                customerName: string;
                                customerPhone: string | null;
                                addressLabel: string;
                                address: string;
                                latitude: string;
                                longitude: string;
                            }[];
                        };
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    routes: {
        ":id": {
            patch: {
                body: {};
                params: {
                    id: string;
                };
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Route completed successfully";
                    } & {
                        readonly status: "success";
                        readonly message: "Route completed successfully";
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {};
} & {
    "admin-dashboard": {
        orders: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Latest orders retrieved successfully";
                        readonly data: {
                            total: number;
                            date: string;
                            id: string;
                            customer: string | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Latest orders retrieved successfully";
                        readonly data: {
                            total: number;
                            date: string;
                            id: string;
                            customer: string | null;
                            status: "cancelled" | "pending" | "processing" | "ready" | "completed";
                        }[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "low-stock": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Low stock items retrieved successfully";
                        readonly data: {
                            id: string;
                            name: string;
                            current: number;
                            safety: number;
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Low stock items retrieved successfully";
                        readonly data: {
                            id: string;
                            name: string;
                            current: number;
                            safety: number;
                        }[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        metrics: {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Dashboard metrics retrieved successfully";
                        readonly data: {
                            totalRevenue: number;
                            totalOrders: number;
                            activeMembers: number;
                            totalStaff: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Dashboard metrics retrieved successfully";
                        readonly data: {
                            totalRevenue: number;
                            totalOrders: number;
                            activeMembers: number;
                            totalStaff: number;
                        };
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "order-status": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Order status data retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").OrderStatusData[];
                    } & {
                        readonly status: "success";
                        readonly message: "Order status data retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").OrderStatusData[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "top-services": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Top services retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").TopServiceItem[];
                    } & {
                        readonly status: "success";
                        readonly message: "Top services retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").TopServiceItem[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "inventory-usage": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Inventory usage retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").InventoryUsageItem[];
                    } & {
                        readonly status: "success";
                        readonly message: "Inventory usage retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").InventoryUsageItem[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "bundling-stats": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Bundling stats retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").BundlingStatsItem[];
                    } & {
                        readonly status: "success";
                        readonly message: "Bundling stats retrieved successfully";
                        readonly data: import("./modules/admin-dashboard").BundlingStatsItem[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "operational-metrics": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Operational metrics retrieved successfully";
                        readonly data: {
                            ordersPending: number;
                            ordersProcessing: number;
                            pickupsPending: number;
                            deliveriesPending: number;
                        };
                    } & {
                        readonly status: "success";
                        readonly message: "Operational metrics retrieved successfully";
                        readonly data: {
                            ordersPending: number;
                            ordersProcessing: number;
                            pickupsPending: number;
                            deliveriesPending: number;
                        };
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "recent-pickups": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Recent pickups retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            customer: string;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Recent pickups retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            customer: string;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                    };
                };
            };
        };
    };
} & {
    "admin-dashboard": {
        "recent-deliveries": {
            get: {
                body: {};
                params: {};
                query: {};
                headers: {};
                response: {
                    200: {
                        readonly status: "success";
                        readonly message: "Recent deliveries retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            customer: string;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                    } & {
                        readonly status: "success";
                        readonly message: "Recent deliveries retrieved successfully";
                        readonly data: {
                            requestedAt: string;
                            id: string;
                            customer: string;
                            address: string;
                            status: "cancelled" | "completed" | "requested" | "in_progress" | "picked_up";
                        }[];
                    };
                };
            };
        };
    };
} & {
    report: {};
} & {
    report: {
        sales: {
            "best-sellers": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    report: {
        sales: {
            "by-order": {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    report: {
        inventory: {
            adjustments: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    report: {
        inventory: {
            usage: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    report: {
        inventory: {
            restock: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    report: {
        member: {
            spending: {
                get: {
                    body: {};
                    params: {};
                    query: {
                        rows?: number | undefined;
                        from: string;
                        to: string;
                    };
                    headers: {};
                    response: {
                        200: Response;
                        422: {
                            type: "validation";
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                    };
                };
            };
        };
    };
} & {
    uploads: {
        ":name": {
            get: {
                body: unknown;
                params: {
                    name: string;
                } & {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("elysia").ElysiaFile;
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export type App = typeof app;
export {};
