import { Elysia, t } from "elysia";

const createVehicleSchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Vehicle name is required",
  }),
  licensePlate: t.String({
    minLength: 1,
    maxLength: 11,
    error: "License plate is required",
  }),
  ownerId: t.Optional(t.String()),
});

const updateVehicleSchema = t.Object({
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
  ownerId: t.Optional(t.Nullable(t.String())),
});

export type CreateVehicleSchema = typeof createVehicleSchema.static;
export type UpdateVehicleSchema = typeof updateVehicleSchema.static;

export const vehiclesModel = new Elysia({ name: "vehicles/model" }).model({
  createVehicleSchema,
  updateVehicleSchema,
});
