# Inventory Audit Logging

## Purpose

Track who made changes to inventory metadata, providing a unified audit trail for non-stock-level mutations.

## Scope

`inventory_logs` tracks **metadata-only** changes:

| Action | Endpoint | Existing Log | `inventory_logs` |
|--------|----------|-------------|------------------|
| Create | `POST /` | ❌ None | ✅ |
| Update | `PATCH /:id` | ❌ None | ✅ |
| Image update | `PATCH /:id/image` | ❌ None | ✅ |
| Delete | `DELETE /:id` | ❌ None | ✅ |
| Restock | `POST /:id/restock` | ✅ `restock_logs` | ❌ |
| Adjust | `PATCH /:id/stock` | ✅ `adjustment_logs` | ❌ |

Stock-level changes remain in existing `restock_logs` / `adjustment_logs`.

---

## Step 1 — Create `inventory_logs` Table

**File:** `src/db/schema/inventory-logs.ts`

```typescript
import { pgTable, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { inventories } from "./inventories";
import { user } from "./auth";
import { nanoid } from "@/db/utils";

export const inventoryLogs = pgTable("inventory_logs", {
  id: varchar("id").primaryKey().$defaultFn(() => `il-${nanoid()}`),
  inventoryId: varchar("inventory_id")
    .references(() => inventories.id, { onDelete: "cascade" })
    .notNull(),
  actorId: varchar("actor_id")
    .references(() => user.id)
    .notNull(),
  action: varchar("action", {
    enum: ["create", "update", "delete", "image_update"],
  }).notNull(),
  changedFields: jsonb("changed_fields"),
  summary: varchar("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Register in** `src/db/schema/index.ts`:

```typescript
export * from "./inventory-logs";
```

**Generate & run migration:**

```bash
bun run drizzle:generate && bun run drizzle:migrate
```

---

## Step 2 — Create Audit Helper

**File:** `src/modules/inventories/audit.ts`

```typescript
import { inventoryLogs } from "@/db/schema/inventory-logs";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

type Action = "create" | "update" | "delete" | "image_update";

interface ChangedField {
  old: unknown;
  new: unknown;
}

export async function logInventoryChange(
  tx: PgTransaction<any, any, ExtractTablesWithRelations<any>>,
  inventoryId: string,
  actorId: string,
  action: Action,
  changedFields: Record<string, ChangedField> | null,
  summary: string | null,
) {
  await tx.insert(inventoryLogs).values({
    inventoryId,
    actorId,
    action,
    changedFields: changedFields as any,
    summary,
  });
}

export function computeChangedFields(
  oldData: Record<string, any>,
  newData: Record<string, any>,
): Record<string, { old: any; new: any }> {
  const result: Record<string, { old: any; new: any }> = {};
  for (const key of Object.keys(newData)) {
    if (key in oldData && oldData[key] !== newData[key]) {
      result[key] = { old: oldData[key], new: newData[key] };
    }
  }
  return result;
}
```

---

## Step 3 — Modify `updateInventory` Service

**File:** `src/modules/inventories/service.ts`

- **Signature:** `updateInventory(id, body)` → `updateInventory(id, actorId, body)`
- **Logic:** Wrap in `db.transaction()`, fetch current row, apply update, compute diff, write log.

```typescript
async updateInventory(id: string, actorId: string, data: UpdateInventoryInput) {
  return await db.transaction(async (tx) => {
    const [old] = await tx.select().from(inventories).where(eq(inventories.id, id)).limit(1);
    if (!old) throw new NotFoundError("Inventory not found");
    await tx.update(inventories).set({ ...data, updatedAt: now() }).where(eq(inventories.id, id));
    const changed = computeChangedFields(old, data);
    if (Object.keys(changed).length > 0) {
      const summary = `Updated ${Object.keys(changed).join(", ")}`;
      await logInventoryChange(tx, id, actorId, "update", changed, summary);
    }
  });
}
```

---

## Step 4 — Modify `addInventory` Service

**File:** `src/modules/inventories/service.ts`

- **Signature:** `addInventory(body)` → `addInventory(actorId, body)`
- **Logic:** After insert, write a "create" log.

```typescript
// inside the existing transaction
await logInventoryChange(tx, inventoryId, actorId, "create", null, "Created inventory");
```

---

## Step 5 — Modify `deleteInventory` Service

**File:** `src/modules/inventories/service.ts`

- **Signature:** `deleteInventory(id)` → `deleteInventory(id, actorId)`
- **Logic:** Before or after soft-delete, write a "delete" log.

```typescript
// inside the existing transaction
await logInventoryChange(tx, id, actorId, "delete", null, "Deleted inventory");
```

---

## Step 6 — Modify `updateInventoryImage` Service

**File:** `src/modules/inventories/service.ts`

- **Signature:** `updateInventoryImage(id, body)` → `updateInventoryImage(id, actorId, body)`
- **Logic:** After updating image, write an "image_update" log.

```typescript
await logInventoryChange(tx, id, actorId, "image_update", null, "Updated image");
```

---

## Step 7 — Update Route Handlers

**File:** `src/modules/inventories/index.ts`

Pass `user.id` as `actorId` to each service call:

| Route | Current | New |
|-------|---------|-----|
| `POST /` | `Inventories.addInventory(body)` | `Inventories.addInventory(user.id, body)` |
| `PATCH /:id` | `Inventories.updateInventory(id, body)` | `Inventories.updateInventory(id, user.id, body)` |
| `PATCH /:id/image` | `Inventories.updateInventoryImage(id, body)` | `Inventories.updateInventoryImage(id, user.id, body)` |
| `DELETE /:id` | `Inventories.deleteInventory(id)` | `Inventories.deleteInventory(id, user.id)` |

---

## Step 8 — Add `GET /:id/logs` Endpoint

### Route

**File:** `src/modules/inventories/index.ts`

```typescript
.get(
  "/:id/logs",
  async ({ params: { id }, status }) => {
    try {
      const logs = await Inventories.getInventoryLogs(id);
      return status(200, { status: "success", data: logs });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: "Inventory not found",
          messageKey: "inventory.notFound",
        });
      }
      throw error;
    }
  },
  { auth: true },
)
```

### Service Method

**File:** `src/modules/inventories/service.ts`

```typescript
async getInventoryLogs(inventoryId: string) {
  const logs = await db.query.inventoryLogs.findMany({
    where: eq(inventoryLogs.inventoryId, inventoryId),
    orderBy: desc(inventoryLogs.createdAt),
    with: {
      actor: { columns: { id: true, name: true, role: true } },
    },
  });
  return logs;
}
```

---

## Audit Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | `varchar PK` | `il-{nanoid}` |
| `inventory_id` | `varchar FK → inventories` | Target inventory |
| `actor_id` | `varchar FK → user` | Who performed the action |
| `action` | `varchar` | `create` / `update` / `delete` / `image_update` |
| `changed_fields` | `jsonb` | `{ field: { old, new }, … }` (null for non-update actions) |
| `summary` | `varchar` | Human-readable description of the change |
| `created_at` | `timestamp` | When the change occurred |
