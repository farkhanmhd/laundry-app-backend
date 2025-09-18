import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "../utils";
import { user } from "./auth";

export const chats = pgTable("chats", {
  id: varchar("id", { length: 12 })
    .primaryKey()
    .$defaultFn(() => `chat-${nanoid()}`),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const chatParticipants = pgTable(
  "chat_participants",
  {
    userId: varchar("user_id").references(() => user.id, { onDelete: "cascade" }),
    chatId: varchar("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.chatId] })],
);

export const messages = pgTable("messages", {
  id: varchar("id", { length: 12 })
    .primaryKey()
    .$defaultFn(() => `msg-${nanoid()}`),
  chatId: varchar("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  authorId: varchar("author_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
  participants: many(chatParticipants),
  messages: many(messages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(user, {
    fields: [chatParticipants.userId],
    references: [user.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  author: one(user, {
    fields: [messages.authorId],
    references: [user.id],
  }),
}));
