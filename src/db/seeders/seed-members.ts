import { db } from "..";
import { members } from "../schema/members";

const randomNames = ["John", "Jane", "James", "Frank", "Josh", "Michael", "Donny", "Chris"];

const seedMembers = async () => {
  const randomUsers = Array.from({ length: 50 }).map(() => ({
    name: randomNames[Math.floor(Math.random() * 7)] as string,
    phone: `+62${Math.floor(Math.random() * 10_000_000)}`,
  }));

  await db.insert(members).values(randomUsers);
};

seedMembers();
