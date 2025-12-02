import { db } from "..";
import { members } from "../schema/members";
import { fakerID_ID as faker } from '@faker-js/faker'

const randomNames = [
  "John",
  "Jane",
  "James",
  "Frank",
  "Josh",
  "Michael",
  "Donny",
  "Chris",
];

const seedMembers = async () => {
  console.log("Seeding users");
  const randomUsers = Array.from({ length: 300 }).map(() => ({
    name: faker.person.fullName(),
    phone: `+62${Math.floor(Math.random() * 10_000_000)}`,
  }));

  await db.transaction(async (tx) => {
    await tx.insert(members).values(randomUsers);
  });
  console.log("finished");
};

seedMembers();
