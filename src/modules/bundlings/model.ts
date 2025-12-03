import { Elysia, t } from "elysia";
import { models } from "@/db/models";

const bundling = t.Object(models.select.bundlings);
const bundlingItem = t.Object(models.select.bundlingItems);
const bundlingWithItems = t.Composite([
  bundling,
  t.Object({ items: t.Array(bundlingItem) }),
]);

const bundlingItemInsert = t.Object(models.insert.bundlingItems);

const addBundling = t.Object({
  name: t.String({
    ...models.insert.inventories.name,
    minLength: 1,
    error: "Bundling name cannot be empty",
  }),
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
  price: t.Numeric({
    ...models.insert.inventories.price,
    minimum: 0,
    error: "Bundling price cannot be empty",
  }),
  description: t.String({
    ...models.insert.inventories.description,
    minLength: 1,
    error: "Bundling description cannot be empty",
  }),
  items: t.Array(t.Omit(bundlingItemInsert, ["id", "bundlingId"])),
});

const updateBundlingData = t.Composite([
  t.Pick(bundling, ["name", "price", "description"]),
]);

const updateBundlingItemBody = t.Array(
  t.Composite([
    t.Omit(bundlingItemInsert, ["id", "bundlingId"]),
    t.Object({
      id: t.Optional(t.Nullable(t.String())),
      bundlingId: t.Optional(t.Nullable(t.String())),
    }),
  ])
);

const updateBundlingImage = t.Pick(addBundling, ["image"]);

export type Bundling = typeof bundling.static;
export type BundlingItem = typeof bundlingItem.static;
export type BundlingWithItem = typeof bundlingWithItems.static;
export type AddBundlingBody = typeof addBundling.static;
export type UpdateBundlingData = typeof updateBundlingData.static;
export type UpdateBundlingItemBody = typeof updateBundlingItemBody.static;
export type UpdateBundlingImageBody = typeof updateBundlingImage.static;

export const bundlingsModel = new Elysia({ name: "inventories/model" }).model({
  addBundling,
  updateBundlingData,
  updateBundlingItemBody,
  updateBundlingImage,
});
