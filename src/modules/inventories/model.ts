import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";
import { searchQuery } from "@/search-query";

const inventory = t.Object({
  ...models.select.inventories,
  isOnBundling: t.Boolean(),
});

export const addInventory = t.Object({
  name: t.String({
    ...models.insert.inventories.name,
    minLength: 1,
    error: "Inventory name cannot be empty",
  }),
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
  price: t.Numeric({
    ...models.insert.inventories.price,
    minimum: 0,
    error: "Inventory price cannot be empty",
  }),
  stock: t.Numeric({
    ...models.insert.inventories.stock,
    minimum: 0,
    error: "Quantity cannot be empty",
  }),
  description: t.String({
    ...models.insert.inventories.description,
    minLength: 1,
    error: "Inventory description cannot be empty",
  }),
  safetyStock: t.Numeric({
    ...models.insert.inventories.safetyStock,
    minimum: 0,
    error: "Reorder point cannot be empty",
  }),
  unit: t.Union([
    t.Literal("kilogram"),
    t.Literal("gram"),
    t.Literal("litre"),
    t.Literal("milliliter"),
    t.Literal("pieces"),
  ]),
  isCustomerOrderable: t.Boolean({
    default: false,
  }),
  maxWeight: t.Optional(
    t.Nullable(
      t.Numeric({
        ...models.insert.inventories.maxWeight,
        minimum: 0,
        error: "Max weight cannot be empty",
      })
    )
  ),
});

const updateInventory = t.Composite([
  t.Pick(addInventory, [
    "name",
    "price",
    "description",
    "safetyStock",
    "unit",
    "isCustomerOrderable",
    "maxWeight",
  ]),
]);

const updateInventoryImage = t.Pick(addInventory, ["image"]);

const adjustmentCategory = t.Object({
  inventoryIds: t.Optional(t.Array(t.String())),
});

const inventoryReportQuery = t.Object({
  from: t.Optional(
    t.String({
      pattern: "^\\d{2}-\\d{2}-\\d{4}$",
      error: "From date must be in DD-MM-YYYY format",
    })
  ),
  to: t.Optional(
    t.String({
      pattern: "^\\d{2}-\\d{2}-\\d{4}$",
      error: "To date must be in DD-MM-YYYY format",
    })
  ),
});

const inventoryHistoryQuery = t.Composite([
  searchQuery,
  adjustmentCategory,
  inventoryReportQuery,
]);

export type AddInventoryBody = typeof addInventory.static;
export type UpdateInventoryBody = typeof updateInventory.static;
export type UpdateInventoryImage = typeof updateInventoryImage.static;
export type Inventory = typeof inventory.static;
export type InventoryHistoryQuery = typeof inventoryHistoryQuery.static;
export type InventoryReportQuery = typeof inventoryReportQuery.static;

const inventoryLogsQuery = t.Composite([searchQuery]);

export type InventoryLogsQuery = typeof inventoryLogsQuery.static;

const addInventoryResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Pick(t.Object(models.select.inventories), ["id"]),
  }),
]);

const inventoriesArray = t.Object({
  data: t.Array(inventory),
});

const getInventories = t.Composite([succesResponse, inventoriesArray]);

export type GetInventories = typeof getInventories.static;
const adjustQuantity = t.Object({
  note: t.Optional(t.String()),
  changeAmount: t.Integer(),
  adjustmentTime: t.String(),
});

export type AdjustQuantitySchema = typeof adjustQuantity.static;

const restockQuantity = t.Object({
  supplier: t.String(),
  restockQuantity: t.Integer(),
  restockTime: t.String(),
  restockPrice: t.Integer(),
  price: t.Optional(t.Nullable(t.Integer())),
  note: t.Optional(t.String()),
});

export type RestockQuantitySchema = typeof restockQuantity.static;

export const movementHistoryRow = t.Object({
  id: t.String(),
  inventory_id: t.String(),
  inventory_name: t.String(),
  type: t.String(),
  change_amount: t.Number(),
  stock_remaining: t.Number(),
  previous_stock: t.Number(),
  reference: t.Nullable(t.String()),
  note: t.Nullable(t.String()),
  actor_name: t.String(),
  input_time: t.String(),
  created_at: t.String(),
  is_latest: t.Boolean(),
});

export type MovementHistoryRow = typeof movementHistoryRow.static;

export const movementHistoryEntry = t.Object({
  id: t.String(),
  inventoryId: t.String(),
  inventoryName: t.String(),
  type: t.String(),
  changeAmount: t.Number(),
  stockRemaining: t.Number(),
  previousStock: t.Number(),
  reference: t.Nullable(t.String()),
  note: t.Nullable(t.String()),
  actorName: t.String(),
  inputTime: t.String(),
  createdAt: t.String(),
  isLatest: t.Boolean(),
});

export type MovementHistoryEntry = typeof movementHistoryEntry.static;

const updateAdjustQuantity = t.Object({
  changeAmount: t.Integer(),
  note: t.Optional(t.String()),
});

export type UpdateAdjustQuantitySchema = typeof updateAdjustQuantity.static;

const updateRestockQuantity = t.Object({
  restockQuantity: t.Integer(),
  note: t.Optional(t.String()),
});

export type UpdateRestockQuantitySchema = typeof updateRestockQuantity.static;

export const inventoriesModel = new Elysia({ name: "inventories/model" }).model(
  {
    addInventory,
    addInventoryResponse,
    getInventories,
    updateInventory,
    updateInventoryImage,
    adjustQuantity,
    inventoryHistoryQuery,
    inventoryLogsQuery,
    inventoryReportQuery,
    restockQuantity,
    updateAdjustQuantity,
    updateRestockQuantity,
  }
);
