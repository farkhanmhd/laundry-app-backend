import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";
import { searchQuery } from "@/search-query";

const inventory = t.Object(models.select.inventories);
const addInventory = t.Object({
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
});

const updateInventory = t.Composite([
  t.Pick(addInventory, ["name", "price", "description", "safetyStock"]),
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
  adjustmentTime: t.Date(),
});

export type AdjustQuantitySchema = typeof adjustQuantity.static;

const restockQuantity = t.Object({
  supplier: t.String(),
  restockQuantity: t.Integer(),
  restockTime: t.Date(),
  note: t.Optional(t.String()),
});

export type RestockQuantitySchema = typeof restockQuantity.static;

export const inventoriesModel = new Elysia({ name: "inventories/model" }).model(
  {
    addInventory,
    addInventoryResponse,
    getInventories,
    updateInventory,
    updateInventoryImage,
    adjustQuantity,
    inventoryHistoryQuery,
    inventoryReportQuery,
    restockQuantity,
  }
);
