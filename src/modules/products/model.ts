import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { defaultResponse } from "@/responses";

const addProduct = t.Object({
  name: t.String({
    ...models.insert.products.name,
    minLength: 1,
    errors: "Product name cannot be empty",
  }),
  image: t.File({
    type: "image",
    maxSize: "5m",
  }),
  price: t.Integer({
    ...models.insert.products.price,
    minimum: 0,
    errors: "Product price cannot be empty",
  }),
  currentQuantity: t.Integer({
    ...models.insert.products.currentQuantity,
    minimum: 0,
    errors: "Quantity cannot be empty",
  }),
});

export type AddProductBody = typeof addProduct.static;

const addProductResponse = t.Composite([
  defaultResponse,
  t.Object({
    data: t.Pick(t.Object(models.select.products), ["id"]),
  }),
]);

const product = t.Object(models.select.products);

export type ProductData = typeof product.static;

const productsArray = t.Object({
  data: t.Array(product),
});

const getProducts = t.Composite([defaultResponse, productsArray]);

export type GetProducts = typeof getProducts.static;

export const productsModel = new Elysia({ name: "products/model" }).model({
  addProduct,
  addProductResponse,
  getProducts,
});
