import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chatParticipants, chats } from "@/db/schema/chats";
import type { CreateChatBody } from "./model";

export abstract class Chats {
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
}
