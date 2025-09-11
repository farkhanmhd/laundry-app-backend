import { Elysia, t } from "elysia";

const message = t.Object({ message: t.String() });
const response = t.Object({
  message: t.String(),
  author: t.String(),
  time: t.Number(),
});

type Message = typeof response.static;

const messages: Message[] = [];

export const chatController = new Elysia({ prefix: "/chat" })
  .model({
    message,
    response,
  })
  .get("/", ({ status }) => {
    return status(200, {
      status: "success",
      message: "Messages retrieved",
      data: messages,
    });
  })
  .ws("/", {
    body: "message",
    response: "response",

    // on open connection call this callback
    open(ws) {
      console.log(`User ${ws.id} entered the chat`);
      ws.subscribe("chat");
    },

    // this callback executed when there is new message
    message(ws, data) {
      const newMessage: Message = {
        message: data.message,
        author: ws.id,
        time: Date.now(),
      };

      messages.push(newMessage);
      ws.publish("chat", newMessage);
    },

    close(ws) {
      console.log(`User ${ws.id} left the chat`);
      ws.unsubscribe("chat");
    },
  });
