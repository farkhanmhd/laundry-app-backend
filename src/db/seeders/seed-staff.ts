import { auth } from "@/auth/auth";

const employeesData = [
  {
    email: "admin@laundry.com",
    name: "admin",
    password: "laundry_admin",
    data: {
      role: "admin",
      username: "admin",
      displayUsername: "admin",
    },
  },
  {
    email: "superadmin@laundry.com",
    name: "Super Admin",
    password: "superadmin",
    data: {
      role: "superadmin",
      username: "superadmin",
      displayUsername: "superadmin",
    },
  },
];

for (const employee of employeesData) {
  await auth.api.createUser({
    body: employee,
  });
}

console.log("finished");
