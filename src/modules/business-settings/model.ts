import { Elysia, t } from "elysia";

const createBusinessSettingsSchema = t.Object({
  address: t.String({ minLength: 1, error: "Address is required" }),
  latitude: t.String({ error: "Latitude is required" }),
  longitude: t.String({ error: "Longitude is required" }),
  maxDistanceKm: t.String({ error: "Max distance is required" }),
});

const updateBusinessSettingsSchema = t.Object({
  address: t.Optional(t.String({ minLength: 1 })),
  latitude: t.Optional(t.String()),
  longitude: t.Optional(t.String()),
  maxDistanceKm: t.Optional(t.String()),
});

export type CreateBusinessSettingsSchema =
  typeof createBusinessSettingsSchema.static;
export type UpdateBusinessSettingsSchema =
  typeof updateBusinessSettingsSchema.static;

export const businessSettingsModel = new Elysia({
  name: "business-settings/model",
}).model({
  createBusinessSettingsSchema,
  updateBusinessSettingsSchema,
});
