# Database Schema

## Auth (Better-Auth)

```typescript
import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { addresses } from "./addresses";
import { deliveries } from "./deliveries";
import { members } from "./members";
import { orders } from "./orders";
import { stockAdjustments } from "./stock-adjustments";

export const roleEnum = pgEnum("role", ["superadmin", "admin", "user"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: roleEnum().default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const usersRelations = relations(user, ({ many, one }) => ({
  member: one(members, {
    fields: [user.id],
    references: [members.userId],
  }),
  orders: many(orders),
  addresses: many(addresses),
  stockAdjustments: many(stockAdjustments),
  deliveries: many(deliveries),
}));

export const auth = betterAuth({
  trustedOrigins: [process.env.FRONTEND_URL as string],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account,
      session,
      user,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    openAPI(),
    admin({ adminRoles: ["admin", "superadmin"] }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
// biome-ignore lint/suspicious/noAssignInExpressions: copied directly from better-auth docs
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth/api") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path] as any;

        for (const method of Object.keys(paths[path] as any)) {
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;

    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: roleEnum().default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const usersRelations = relations(user, ({ many, one }) => ({
  member: one(members),
  shifts: many(shifts),
  orders: many(orders),
  stockAdjustments: many(stockAdjustments),
}));


```

## Addresses

```typescript
import { randomUUIDv7 } from "bun";
import { numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { user } from "./auth";

export const addresses = pgTable("addresses", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `addr-${randomUUIDv7()}`),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  label: varchar("label", { length: 50 }),
  address: varchar("address", { length: 255 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));

```

## Bundlings

```typescript
import { randomUUIDv7 } from "bun";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { bundlingItems } from "./bundlingItems";

export const bundlings = pgTable("bundlings", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `bnd-${randomUUIDv7()}`),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  price: integer("price").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const bundlingsRelations = relations(bundlings, ({ many }) => ({
  bundlingItems: many(bundlingItems),
}));

```

## Bundling Items

```typescript
import { randomUUIDv7 } from "bun";
import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { services } from "./services";

export const bundlingType = pgEnum("itemType", ["service", "inventory"]);

export const bundlingItems = pgTable("bundling_items", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `bi-${randomUUIDv7()}`),
  bundlingId: varchar("bundling_id")
    .references(() => bundlings.id, { onDelete: "cascade" })
    .notNull(),
  itemType: bundlingType().notNull(),
  serviceId: varchar("service_id")
    .references(() => services.id)
    .notNull(),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
});

export const bundlingItemsRelations = relations(bundlingItems, ({ one }) => ({
  bundling: one(bundlings, {
    fields: [bundlingItems.bundlingId],
    references: [bundlings.id],
  }),
  service: one(services, {
    fields: [bundlingItems.serviceId],
    references: [services.id],
  }),
  inventory: one(inventories, {
    fields: [bundlingItems.inventoryId],
    references: [inventories.id],
  }),
}));

```

## Deliveries

```typescript
import { randomUUIDv7 } from "bun";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { addresses } from "./addresses";
import { user } from "./auth";
import { orders } from "./orders";

export const deliveryTypeEnum = pgEnum("deliveryType", ["pickup", "dropoff"]);

export const deliveryStatusEnum = pgEnum("deliveryStatus", [
  "requested",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const deliveries = pgTable("deliveries", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `dlv-${randomUUIDv7()}`),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  addressId: varchar("address_id")
    .references(() => addresses.id, { onDelete: "cascade" })
    .notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  type: deliveryTypeEnum().notNull(),
  status: deliveryStatusEnum().default("requested").notNull(),
  notes: varchar("notes", { length: 255 }),
  requestedAt: timestamp("requested_at", { mode: "string" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "string" }),
});

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  user: one(user, { fields: [deliveries.userId], references: [user.id] }),
  address: one(addresses, {
    fields: [deliveries.addressId],
    references: [addresses.id],
  }),
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
}));

```

## Inventories

```typescript
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { orderItems } from "./order-items";
import { stockAdjustments } from "./stock-adjustments";

export const inventoryUnitEnum = pgEnum("inventoryUnit", [
  "kilogram",
  "gram",
  "litre",
  "milliliter",
  "pieces",
]);

export const inventories = pgTable(
  "inventories",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$defaultFn(() => `p-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    description: varchar("description", { length: 512 }).notNull(),
    image: varchar("image"),
    price: integer("price").notNull(),
    unit: inventoryUnitEnum(),
    stock: integer("current_quantity").notNull().default(0),
    safetyStock: integer("safety_stock").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [
    check("current_quantity_check", sql`${table.stock} >= 0`),
    check("price_check", sql`${table.price} >= 0`),
  ]
);

export const inventoriesRelations = relations(inventories, ({ many }) => ({
  orderItems: many(orderItems),
  stockAdjustments: many(stockAdjustments),
}));

export type InventoryInsert = typeof inventories.$inferInsert;

```

## Members

```typescript
import { relations } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { orders } from "./orders";
import { redemptionHistory } from "./redemption-history";

export const members = pgTable("members", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `c-${nanoid()}`),
  name: varchar("name", { length: 50 }).notNull(),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "set null" })
    .unique(),
  phone: varchar("phone", { length: 24 }).unique().notNull(),
  points: integer("points").default(0).notNull(),
});

export const membersRelations = relations(members, ({ many, one }) => ({
  user: one(user, {
    fields: [members.userId],
    references: [user.id],
  }),
  orders: many(orders),
  redemptionHistory: many(redemptionHistory),
}));

```

## Order Items

```typescript
import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { bundlings } from "./bundlings";
import { inventories } from "./inventories";
import { orders } from "./orders";
import { services } from "./services";
import { vouchers } from "./vouchers";

export const itemTypeEnum = pgEnum("itemType", [
  "service",
  "inventory",
  "bundling",
  "voucher",
]);

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `od-${nanoid(5)}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  itemType: itemTypeEnum().notNull(),
  serviceId: varchar("service_id").references(() => services.id),
  inventoryId: varchar("inventory_id").references(() => inventories.id),
  bundlingId: varchar("bundling_id").references(() => bundlings.id),
  voucherId: varchar("voucher_id").references(() => vouchers.id),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
  inventory: one(inventories, {
    fields: [orderItems.inventoryId],
    references: [inventories.id],
  }),
  bundling: one(bundlings, {
    fields: [orderItems.bundlingId],
    references: [bundlings.id],
  }),
  voucher: one(vouchers, {
    fields: [orderItems.voucherId],
    references: [vouchers.id],
  }),
}));

```

## Orders

```typescript
import { relations } from "drizzle-orm";
import { pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";
import { members } from "./members";
import { orderItems } from "./order-items";
import { payments } from "./payments";
import { redemptionHistory } from "./redemption-history";

export const orderStatusEnum = pgEnum("orderStatus", [
  "pending", // waiting for payment
  "processing", // paid and work in progress
  "ready", // finished working and ready to be pickedup by customer
  "completed", // picked up by customer
]);

export const orders = pgTable("orders", {
  id: varchar("id", { length: 8 })
    .primaryKey()
    .$defaultFn(() => `o-${nanoid(5)}`),
  customerName: varchar("customer_name", { length: 50 }), // handle non member
  memberId: varchar("member_id").references(() => members.id),
  userId: varchar("user_id") // staff id
    .references(() => user.id)
    .notNull(),
  status: orderStatusEnum().notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  member: one(members, {
    fields: [orders.memberId],
    references: [members.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  orderItems: many(orderItems),
  payments: many(payments),
  redemptionHistory: many(redemptionHistory),
}));

```

## Payments

```typescript
import { randomUUIDv7 } from "bun";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { orders } from "./orders";

export const paymentTypeEnum = pgEnum("paymentType", ["qris", "cash"]);

export const payments = pgTable("payment_detail", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `pd-${randomUUIDv7()}`),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  paymentType: paymentTypeEnum(),

  discountAmount: integer("discount_amount").notNull(),
  amountPaid: integer("amount_paid").notNull(), // if not cash then amountPaid === total
  change: integer("change"), // possible if cash. if not cash then 0
  total: integer("total").notNull(), // customer total payment

  transactionStatus: varchar("transaction_status"),
  transactionTime: timestamp("transaction_time", { mode: "string" })
    .defaultNow()
    .notNull(),
  fraudStatus: varchar("fraud_status", { length: 20 }).notNull(),
  expiryTime: timestamp("expiry_time", { mode: "string" }).notNull(),

  // QRIS specific fields
  qrString: varchar("qr_string", { length: 500 }),
  acquirer: varchar("acquirer", { length: 50 }),
  actions:
    jsonb("actions").$type<{ name: string; method: string; url: string }[]>(),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

```

## Redemption History

```typescript
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { members } from "./members";
import { orders } from "./orders";
import { vouchers } from "./vouchers";

export const redemptionHistory = pgTable("redemption_history", {
  id: varchar("id").primaryKey(),
  memberId: varchar("member_id")
    .references(() => members.id)
    .notNull(),
  voucherId: varchar("voucher_id")
    .references(() => vouchers.id)
    .notNull(),
  orderId: varchar("order_id")
    .references(() => orders.id)
    .notNull(),
  pointsSpent: integer("points_spent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const redemptionHistoryRelations = relations(
  redemptionHistory,
  ({ one }) => ({
    member: one(members, {
      fields: [redemptionHistory.memberId],
      references: [members.id],
    }),
    voucher: one(vouchers, {
      fields: [redemptionHistory.voucherId],
      references: [vouchers.id],
    }),
    order: one(orders, {
      fields: [redemptionHistory.orderId],
      references: [orders.id],
    }),
  })
);

```

## Services

```typescript
import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { bundlingItems } from "./bundlingItems";
import { orderItems } from "./order-items";

export const services = pgTable(
  "services",
  {
    id: varchar("id", { length: 6 })
      .primaryKey()
      .$default(() => `s-${nanoid()}`),
    name: varchar("name", { length: 128 }).notNull(),
    image: varchar("image"),
    description: varchar("description", { length: 512 }).notNull(),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [check("price_check", sql`${table.price} >= 0`)]
);

export type ServiceInsert = typeof services.$inferInsert;

export const servicesRelations = relations(services, ({ many }) => ({
  orderItems: many(orderItems),
  bundlingItems: many(bundlingItems),
}));

```

## Stock Adjustment

```typescript
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { user } from "./auth";
import { inventories } from "./inventories";

export const stockAdjustments = pgTable("stock_adjustments", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => `sa-${nanoid(5)}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id")
    .references(() => user.id)
    .notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    inventory: one(inventories, {
      fields: [stockAdjustments.inventoryId],
      references: [inventories.id],
    }),
    user: one(user, {
      fields: [stockAdjustments.userId],
      references: [user.id],
    }),
  })
);

```

## Vouchers

```typescript
import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { nanoid } from "../utils";
import { redemptionHistory } from "./redemption-history";

export const vouchers = pgTable("vouchers", {
  id: varchar("id", { length: 6 })
    .primaryKey()
    .$defaultFn(() => `v-${nanoid()}`),
  code: varchar("code", { length: 32 }).unique().notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  discountAmount: integer("discount_amount").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  redemptionHistory: many(redemptionHistory),
}));

```
