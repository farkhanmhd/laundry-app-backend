import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";
import { searchQuery } from "@/search-query";

const inventory = t.Object(models.select.inventories);
const addInventory = t.Object({
  ...models.insert.inventories,
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
});

const updateInventory = t.Composite([
  t.Pick(addInventory, ["name", "price", "description", "safetyStock", "unit"]),
]);

const updateInventoryImage = t.Pick(addInventory, ["image"]);

const category = t.Optional(t.Array(models.select.stockLogs.type));

const adjustmentCategory = t.Object({
  category,
  inventoryIds: t.Optional(t.Array(t.String())),
});

const inventoryHistoryQuery = t.Composite([searchQuery, adjustmentCategory]);

export type AddInventoryBody = typeof addInventory.static;
export type UpdateInventoryBody = typeof updateInventory.static;
export type UpdateInventoryImage = typeof updateInventoryImage.static;
export type Inventory = typeof inventory.static;
export type InventoryHistoryQuery = typeof inventoryHistoryQuery.static;

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

const allowedAdjustType = ["adjustment", "waste", "restock"] as const;
const adjustQuantity = t.Object({
  note: models.insert.stockLogs.note,
  changeAmount: models.insert.stockLogs.changeAmount,
  type: t.Union(allowedAdjustType.map((val) => t.Literal(val))),
});

export type AdjustQuantitySchema = typeof adjustQuantity.static;

export const inventoriesModel = new Elysia({ name: "inventories/model" }).model(
  {
    addInventory,
    addInventoryResponse,
    getInventories,
    updateInventory,
    updateInventoryImage,
    adjustQuantity,
    inventoryHistoryQuery,
  }
);
