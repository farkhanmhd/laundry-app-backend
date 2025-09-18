import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { chatParticipants, chats, messages } from "@/db/schema/chats";
import type { CreateChatBody, NewMessageBody } from "./model";

export abstract class Chats {
  static async getChatList(userId: string) {
    const lastMessageSubQuery = db.selectDistinctOn([messages.chatId]).from(messages).orderBy(messages.chatId, desc(messages.createdAt)).as("last_message");

    const cp1 = alias(chatParticipants, "cp1");
    const cp2 = alias(chatParticipants, "cp2");

    const rows = await db
      .select({
        chatId: cp1.chatId,
        recipientName: user.name,
        recipientImage: user.image,
        lastMessage: lastMessageSubQuery.content,
        lastMessageTime: lastMessageSubQuery.createdAt,
      })
      .from(cp1)
      .innerJoin(cp2, and(eq(cp1.chatId, cp2.chatId), ne(cp2.userId, userId)))
      .innerJoin(user, eq(cp2.userId, user.id))
      .leftJoin(lastMessageSubQuery, eq(cp1.chatId, lastMessageSubQuery.chatId))
      .where(eq(cp1.userId, userId))
      .orderBy(desc(lastMessageSubQuery.createdAt));

    return rows;
  }

  static async getChatMessagesByID(chatId: string) {
    const result = await db
      .select({
        id: messages.id,
        content: messages.content,
        authorId: messages.authorId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(chats, eq(chats.id, chatId))
      .orderBy(messages.createdAt);

    return result;
  }

  static async checkExistingChat({ userId, participantId }: CreateChatBody) {
    // check if chat between 2 users already exist
    const subQuery = db.select({ count: count() }).from(chatParticipants).where(eq(chatParticipants.chatId, chats.id));

    const existingChatRows = await db
      .select({ id: chats.id })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(inArray(chatParticipants.userId, [userId, participantId]))
      .groupBy(chats.id)
      .having(and(eq(count(chats.id), 2), eq(subQuery, 2)));

    if (existingChatRows.length > 0) {
      return existingChatRows[0]?.id;
    }
  }

  static async createNewChat({ userId, participantId }: CreateChatBody) {
    const newChatId = (await db.insert(chats).values({}).returning({ id: chats.id }))[0]?.id;

    await db.insert(chatParticipants).values([
      {
        chatId: newChatId,
        userId,
      },
      {
        chatId: newChatId,
        userId: participantId,
      },
    ]);

    return newChatId;
  }

  static async createChatMessage(data: NewMessageBody) {
    const newMessage = (
      await db.insert(messages).values(data).returning({
        id: messages.id,
        content: messages.content,
        authorId: messages.authorId,
        createdAt: messages.createdAt,
      })
    )[0];

    return newMessage;
  }

  static async getRecipientId(chatId: string, authorId: string) {
    const recipient = (
      await db
        .select({ id: chatParticipants.userId })
        .from(chatParticipants)
        .where(and(eq(chatParticipants.chatId, chatId), ne(chatParticipants.userId, authorId)))
        .limit(1)
    )[0];

    if (recipient) {
      return recipient.id;
    }
  }

  static async getChatUsers(userId: string) {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(ne(user.id, userId));

    return users;
  }
}
