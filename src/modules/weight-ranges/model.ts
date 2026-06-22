import { Elysia, t } from "elysia";

const createWeightRangeSchema = t.Object({
  label: t.String({ minLength: 1 }),
  minWeight: t.Number({ minimum: 0 }),
  maxWeight: t.Number({ minimum: 0 }),
});

const updateWeightRangeSchema = t.Partial(
  t.Composite([
    createWeightRangeSchema,
    t.Object({
      isActive: t.Boolean(),
    }),
  ])
);

export type CreateWeightRangeSchema = typeof createWeightRangeSchema.static;
export type UpdateWeightRangeSchema = typeof updateWeightRangeSchema.static;

export const weightRangesModel = new Elysia({ name: "weight-ranges/model" }).model({
  createWeightRangeSchema,
  updateWeightRangeSchema,
});
