import { auth } from "@/auth/auth";

console.log("seeding user...");

const user = {
  email: "user@test.com",
  name: "User",
  password: "test_user",
  data: {
    role: "user",
    username: "testuser",
    displayUsername: "testuser",
  },
};

await auth.api.createUser({
  body: user,
});

console.log("finished adding user");
