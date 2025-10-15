import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

const service = t.Object(models.select.services);

const addService = t.Object({
  name: t.String({
    ...models.insert.services.name,
    minLength: 1,
    error: "Service name cannot be empty",
  }),
  image: t.File({
    type: "image/*",
    maxSize: "5m",
  }),
  price: t.Numeric({
    ...models.insert.services.price,
    minimum: 0,
    error: "Service price cannot be empty",
  }),
});

const updateService = t.Composite([t.Pick(addService, ["name", "price"])]);
const updateServiceImage = t.Pick(addService, ["image"]);

export type AddServiceBody = typeof addService.static;
export type UpdateServiceBody = typeof updateService.static;
export type UpdateServiceImage = typeof updateServiceImage.static;

const addServiceResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Pick(t.Object(models.select.services), ["id"]),
  }),
]);

const servicesArray = t.Object({
  data: t.Array(service),
});

const getServices = t.Composite([succesResponse, servicesArray]);

export type GetServices = typeof getServices.static;

export const servicesModel = new Elysia({ name: "services/model" }).model({
  addService,
  addServiceResponse,
  getServices,
  updateService,
  updateServiceImage,
});
