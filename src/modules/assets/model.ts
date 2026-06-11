import { Elysia, t } from "elysia";

const createAssetSchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Asset name is required",
  }),
  licensePlate: t.String({
    minLength: 1,
    maxLength: 11,
    error: "License plate is required",
  }),
});

const updateAssetSchema = t.Object({
  name: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 255,
    })
  ),
  licensePlate: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 11,
    })
  ),
});

export type CreateAssetSchema = typeof createAssetSchema.static;
export type UpdateAssetSchema = typeof updateAssetSchema.static;

export const assetsModel = new Elysia({ name: "assets/model" }).model({
  createAssetSchema,
  updateAssetSchema,
});
