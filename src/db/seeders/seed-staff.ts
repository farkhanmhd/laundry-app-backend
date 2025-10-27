import { authClient } from "@/auth-client";

const { data, error } = await authClient.signUp.email({
  email: "admin@laundry.com",
  name: "admin",
  password: "laundry_admin",
  username: "admin",
  displayUsername: "admin",
});

if (data) {
  console.log(data);
}

if (error) {
  console.log(error);
}
