import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

const createChatBodyModel = t.Object({
  userId: t.String({
    ...models.insert.user.id,
    minLength: 1,
    error: "User Id cannot be empty",
  }),
  participantId: t.String({
    ...models.insert.user.id,
    minLength: 1,
    error: "User Id cannot be empty",
  }),
});

const createChatResponseModel = t.Composite([
  succesResponse,
  t.Object({
    data: t.Object({
      id: t.String({
        ...models.select.chats.id,
      }),
    }),
  }),
]);

export type CreateChatBody = typeof createChatBodyModel.static;

export const chatModels = new Elysia({ name: "chat/model" }).model({
  createChatBody: createChatBodyModel,
  createChatResponse: createChatResponseModel,
});
