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

const chatListUpdate = t.Object({
  chatId: t.String(),
  lastMessage: t.String(),
  lastMessageTime: t.String(),
});

const getUserResponse = t.Object({
  id: t.String(),
  name: t.String(),
});

const response = t.Object(models.select.messages);
const messageResponse = t.Omit(response, ["chatId"]);
const newMessage = t.Object({ message: t.String() });

export type NewMessageBody = Omit<typeof response.static, "id" | "createdAt">;
export type NewMessageResponse = typeof messageResponse.static;
export type CreateChatBody = typeof createChatBodyModel.static;
export type ChatListUpdate = typeof chatListUpdate.static;

export const chatModels = new Elysia({ name: "chat/model" }).model({
  createChatBody: createChatBodyModel,
  createChatResponse: createChatResponseModel,
  newMessage,
  messageResponse,
  chatListUpdate,
  getUserResponse,
});
