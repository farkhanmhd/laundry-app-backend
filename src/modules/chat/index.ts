import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth-instance";
import { type ChatListUpdate, chatModels, type NewMessageBody, type NewMessageResponse } from "./model";
import { Chats } from "./service";

export const chatController = new Elysia({ prefix: "/chat" })
  .use(chatModels)
  .use(betterAuth)
  .get(
    "/user",
    async ({ user, status }) => {
      const users = await Chats.getChatUsers(user.id);

      return status(200, {
        status: "success",
        message: "User retrieved",
        data: users,
      });
    },
    {
      auth: true,
    },
  )
  .ws("/list", {
    auth: true,
    response: "chatListUpdate",
    open(ws) {
      const { id: userId } = ws.data.user;
      ws.subscribe(`chatlist-${userId}`);
    },

    close(ws) {
      const { id: userId } = ws.data.user;
      ws.unsubscribe(`chatlist-${userId}`);
    },
  })
  .get(
    "/",
    async ({ status, user }) => {
      const chats = await Chats.getChatList(user.id);
      return status(200, {
        status: "success",
        message: "Chat list retrieved",
        data: chats,
      });
    },
    {
      auth: true,
    },
  )
  .post(
    "/",
    async ({ status, body }) => {
      const existingChatId = await Chats.checkExistingChat(body);

      if (existingChatId) {
        return status(200, {
          status: "success",
          message: "Chat ID Retrieved",
          data: {
            id: existingChatId as string,
          },
        });
      }

      const newChatId = await Chats.createNewChat(body);

      if (newChatId) {
        return status(201, {
          status: "created",
          message: "New Chat ID Created",
          data: {
            id: newChatId,
          },
        });
      }
    },
    {
      body: "createChatBody",
      auth: true,
      parse: "application/json",
    },
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get(
    "/:id",
    async ({ status, params: { id } }) => {
      const messages = await Chats.getChatMessagesByID(id);

      return status(200, {
        status: "success",
        message: "Messages retrieved",
        data: messages,
      });
    },
    {
      auth: true,
    },
  )
  .ws("/:id", {
    body: "newMessage",
    response: "messageResponse",
    auth: true,
    // on open connection call this callback
    open(ws) {
      const { id: userId } = ws.data.user;
      console.log(`User ${userId} entered the chat`);
      const { id: chatId } = ws.data.params;
      ws.subscribe(chatId);
    },

    // this callback executed when there is new message
    async message(ws, data) {
      const { id: chatId } = ws.data.params;
      const { id: authorId } = ws.data.user;

      const newMessage: NewMessageBody = {
        chatId,
        authorId,
        content: data.message,
      };

      const newMessageResponse = await Chats.createChatMessage(newMessage);

      ws.publish(chatId, newMessageResponse as NewMessageResponse);

      const chatListUpdatePayload: ChatListUpdate = {
        chatId,
        lastMessage: data.message,
        lastMessageTime: new Date().toISOString(),
      };

      const payloadAsString = JSON.stringify(chatListUpdatePayload);
      ws.raw.publish(`chatlist-${authorId}`, payloadAsString);

      const recipientId = await Chats.getRecipientId(chatId, authorId);
      if (recipientId) {
        ws.raw.publish(`chatlist-${recipientId}`, payloadAsString);
      }
    },

    close(ws) {
      const { id: userId } = ws.data.user;
      console.log(`User ${userId} left the chat`);
      const { id: chatId } = ws.data.params;
      ws.unsubscribe(chatId);
    },
  });
