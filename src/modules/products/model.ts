import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

const product = t.Object(models.select.products);

const addProduct = t.Object({
  name: t.String({
    ...models.insert.products.name,
    minLength: 1,
    error: "Product name cannot be empty",
  }),
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
  price: t.Numeric({
    ...models.insert.products.price,
    minimum: 0,
    error: "Product price cannot be empty",
  }),
  currentQuantity: t.Numeric({
    ...models.insert.products.currentQuantity,
    minimum: 0,
    error: "Quantity cannot be empty",
  }),
  reorderPoint: t.Numeric({
    ...models.insert.products.reorderPoint,
    minimum: 0,
    error: "Reorder point cannot be empty",
  }),
});

const updateProduct = t.Composite([t.Pick(addProduct, ["name", "price"]), t.Partial(t.Pick(addProduct, ["reorderPoint"]))]);
const updateProductImage = t.Pick(addProduct, ["image"]);

export type AddProductBody = typeof addProduct.static;
export type UpdateProductBody = typeof updateProduct.static;
export type UpdateProductImage = typeof updateProductImage.static;

const addProductResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Pick(t.Object(models.select.products), ["id"]),
  }),
]);

const productsArray = t.Object({
  data: t.Array(product),
});

const getProducts = t.Composite([succesResponse, productsArray]);

export type GetProducts = typeof getProducts.static;

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

export const productsModel = new Elysia({ name: "products/model" }).model({
  addProduct,
  addProductResponse,
  getProducts,
  updateProduct,
  updateProductImage,
  adjustQuantity,
});
