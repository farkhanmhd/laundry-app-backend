import { inventoryLogs } from "@/db/schema/inventory-logs";
import type { Transaction } from "@/utils";

type Action = "create" | "update" | "delete" | "image_update";

export async function logInventoryChange(
  tx: Transaction,
  inventoryId: string,
  actorId: string,
  action: Action,
  changedFields: Record<string, { old: unknown; new: unknown }> | null,
  summary: string | null
) {
  await tx.insert(inventoryLogs).values({
    inventoryId,
    actorId,
    action,
    changedFields: changedFields as Record<string, unknown> | null,
    summary,
  });
}

export function computeChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const result: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(newData)) {
    if (key in oldData && oldData[key] !== newData[key]) {
      result[key] = { old: oldData[key], new: newData[key] };
    }
  }
  return result;
}
