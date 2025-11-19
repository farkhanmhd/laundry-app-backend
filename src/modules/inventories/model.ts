import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

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
    error: "Inventory name cannot be empty",
  }),
  safetyStock: t.Numeric({
    ...models.insert.inventories.safetyStock,
    minimum: 0,
    error: "Reorder point cannot be empty",
  }),
});

const updateInventory = t.Composite([
  t.Pick(addInventory, ["name", "price", "description"]),
  t.Partial(t.Pick(addInventory, ["reorderPoint"])),
]);

const updateInventoryImage = t.Pick(addInventory, ["image"]);

export type AddInventoryBody = typeof addInventory.static;
export type UpdateInventoryBody = typeof updateInventory.static;
export type UpdateInventoryImage = typeof updateInventoryImage.static;
export type Inventory = typeof inventory.static;

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
  newQuantity: t.Number({
    ...models.insert.stockAdjustments.newQuantity,
    minimum: 1,
    error: "New Quantity must be a postitive number",
  }),
  reason: t.String({
    ...models.insert.stockAdjustments.reason,
    minLength: 3,
    error: "Reason is required",
  }),
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
  }
);
