# Plan: Add Faceted Filters with Query Validation

## Overview

Add query validation schemas and service-level filtering for multiple list endpoints. Each task is independent and can be executed in parallel.

---

## Task 1: Orders — Add `status` filter

**Route:** `GET /orders` in `src/modules/orders/index.ts`
**Current schema:** `searchQuery` (`search`, `rows`, `page`)
**DB enum:** `orderStatusEnum` — `cancelled`, `pending`, `processing`, `ready`, `completed`
**DB column:** `ordersTable.status`

### Steps

1. **Create `src/modules/orders/model.ts`:**

```typescript
import { Elysia, t } from "elysia";
import { searchQuery } from "@/search-query";

export const ordersQuery = t.Composite([
  searchQuery,
  t.Object({
    status: t.Optional(
      t.Union([
        t.Literal("cancelled"),
        t.Literal("pending"),
        t.Literal("processing"),
        t.Literal("ready"),
        t.Literal("completed"),
      ])
    ),
  }),
]);

export const ordersModel = new Elysia({ name: "orders/model" }).model({
  ordersQuery,
});
```

2. **Update `src/modules/orders/index.ts`:**
   - Import `ordersModel` and replace `.use(searchQueryModel)` with `.use(ordersModel)`
   - Change `query: "searchQuery"` → `query: "ordersQuery"`

3. **Update `src/modules/orders/service.ts` `getOrders()`:**
   - Destructure `status` from `query` alongside `search`, `rows`, `page`
   - Add to the `filters` array (before the `searchLogic` push):
     ```typescript
     if (status) {
       filters.push(eq(ordersTable.status, status));
     }
     ```
   - Import `eq` from `drizzle-orm` if not already imported
   - Update the `SearchQuery` type import if used

---

## Task 2: Deliveries — Fix status enum mismatch (pickups & deliveries)

**Route:** `GET /deliveries/pickups` and `GET /deliveries/deliveries` in `src/modules/deliveries/index.ts`
**Current schema:** `deliveriesSearchQuery` in `src/modules/deliveries/model.ts`
**DB enum:** `deliveryStatusEnum` — `requested`, `in_progress`, `picked_up`, `completed`, `cancelled`
**Issue:** The current validation schema uses `t.Literal("assigned")` (not in DB) but is missing `t.Literal("picked_up")` (exists in DB)

### Steps

1. **Update `src/modules/deliveries/model.ts`:**
   - Replace `t.Literal("assigned")` with `t.Literal("picked_up")` in the `status` union

2. **Update `src/modules/deliveries/service.ts` `getPickups()` and `getDeliveries()`:**
   - Add `"picked_up"` to the status type cast if needed (e.g., `` status as "requested" | "in_progress" | "picked_up" | "completed" | "cancelled" ``)

---

## Task 3: Members — Add `type` filter (user / non-user)

**Route:** `GET /members` in `src/modules/members/index.ts`
**Current schema:** `searchQuery`
**DB column:** `membersTable.userId` (nullable varchar)

### Steps

1. **Update `src/modules/members/model.ts` — add `membersQuery`:**

```typescript
export const membersQuery = t.Composite([
  searchQuery,
  t.Object({
    type: t.Optional(
      t.Union([t.Literal("user"), t.Literal("non-user")])
    ),
  }),
]);

// Add to membersModel
membersQuery,
```

2. **Update `src/modules/members/index.ts`:**
   - In the `GET /` route, change `query: "searchQuery"` → `query: "membersQuery"`

3. **Update `src/modules/members/service.ts` `getMembers()`:**
   - Destructure `type` from `query`
   - Convert the `type` filter logic:
     ```typescript
     const filters: SQL[] = [];
     if (type === "user") {
       filters.push(isNotNull(membersTable.userId));
     } else if (type === "non-user") {
       filters.push(isNull(membersTable.userId));
     }
     ```
   - Change the `whereQuery` from `or(...)` to wrap in `and(...)` if any filters exist:
     ```typescript
     const conditions = [or(searchById, searchByName, searchByPhone), ...filters];
     const whereQuery = and(...conditions);
     ```
   - Import `isNotNull`, `isNull`, `and`, `SQL` from `drizzle-orm`

---

## Task 4: Vouchers — Add full query with filters (visibility, type) + pagination

**Route:** `GET /vouchers` in `src/modules/vouchers/index.ts`
**Current state:** No query schema, no pagination/no filtering. Returns all non-deleted vouchers.

### Steps

1. **Update `src/modules/vouchers/model.ts` — add `vouchersQuery`:**

```typescript
import { Elysia, t } from "elysia";
import { searchQuery } from "@/search-query";

export const vouchersQuery = t.Composite([
  searchQuery,
  t.Object({
    visibility: t.Optional(
      t.Union([t.Literal("true"), t.Literal("false")])
    ),
    type: t.Optional(
      t.Union([t.Literal("percentage"), t.Literal("fixed")])
    ),
  }),
]);

// Add to vouchersModel
vouchersQuery,
```

2. **Update `src/modules/vouchers/index.ts`:**
   - Import the updated `vouchersModel`
   - Import `searchQueryModel` (if not yet used) and add `.use(searchQueryModel)`
   - Update the route handler to accept `query`:
     - Change `async ({ status })` → `async ({ status, query })`
     - Pass `query` to `Vouchers.getAllVouchers(query)`
   - Add `query: "vouchersQuery"` to route config

3. **Update `src/modules/vouchers/service.ts` `getAllVouchers()`:**
   - Accept `query` parameter typed as the vouchers query type
   - Destructure `search`, `rows`, `page`, `visibility`, `type`
   - Build conditions array:
     ```typescript
     const conditions: SQL[] = [isNull(vouchers.deletedAt)];
     if (visibility === "true") {
       conditions.push(eq(vouchers.isVisible, true));
     } else if (visibility === "false") {
       conditions.push(eq(vouchers.isVisible, false));
     }
     if (type === "percentage") {
       conditions.push(isNotNull(vouchers.discountPercentage));
     } else if (type === "fixed") {
       conditions.push(isNotNull(vouchers.discountAmount));
     }
     if (search) {
       conditions.push(
         or(
           ilike(vouchers.code, `%${search}%`),
           ilike(vouchers.name, `%${search}%`)
         )
       );
     }
     ```
   - Apply pagination with `limit` and `offset`
   - Return `{ data, totalData, totalPages }` (count total with a separate query or use SQL_CALC_FOUND_ROWS equivalent)

---

## Task 5: Users — Add `role` filter

**Route:** `GET /users` in `src/modules/users/index.ts`
**Current schema:** `searchQuery`
**DB column:** `user.role`
**DB enum values:** `superadmin`, `admin`, `driver`, `user`

### Steps

1. **Update `src/modules/users/model.ts` — add `usersQuery`:**

```typescript
import { Elysia, t } from "elysia";
import { searchQuery } from "@/search-query";

export const usersQuery = t.Composite([
  searchQuery,
  t.Object({
    role: t.Optional(
      t.Union([
        t.Literal("user"),
        t.Literal("driver"),
        t.Literal("admin"),
        t.Literal("superadmin"),
      ])
    ),
  }),
]);

// Add to usersModel
usersQuery,
```

2. **Update `src/modules/users/index.ts`:**
   - In the `GET /` route, change `query: "searchQuery"` → `query: "usersQuery"`

3. **Update `src/modules/users/service.ts` `getUsers()`:**
   - Destructure `role` from `query`
   - Change the `whereQuery` construction to use an array pattern:
     ```typescript
     const conditions: SQL[] = [];
     const searchConditions = or(searchByUsername, searchByName, searchByPhone);
     if (searchConditions) conditions.push(searchConditions);
     if (role) conditions.push(eq(user.role, role));
     const whereQuery = conditions.length > 0 ? and(...conditions) : undefined;
     ```
   - Import `eq`, `and`, `SQL` from `drizzle-orm`

---

## Parallel Execution Notes

- **Task 1–5** are fully independent — no shared files between them except `searchQuery` (which is already imported and read-only).
- Each task modifies exactly three files: `model.ts`, `index.ts` (route), `service.ts`.
- No migrations or schema changes needed — all columns and enums already exist in the database.
