import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
  ],
  session: ["list", "revoke", "delete"],
} as const;

export const accessControl = createAccessControl(statement);

export const user = accessControl.newRole({
  user: ["create", "list", "set-password"],
});

export const admin = accessControl.newRole({
  user: ["create", "list", "set-password"],
});

export const superadmin = accessControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
  ],
  session: ["list", "revoke", "delete"],
});
