import { authClient } from "@/auth-client";

const { data, error } = await authClient.signUp.email({
  email: "user@laundry.com",
  name: "staff",
  password: "laundry_staff",
  username: "staff",
  role: "staff",
});

if (data) {
  console.log(data);
}

if (error) {
  console.log(error);
}
