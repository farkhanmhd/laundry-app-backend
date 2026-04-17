import { Elysia, t } from "elysia";

// export const updateProfileSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.email().min(3, "Email must be at least 3 characters"),
//   phone: positiveIntNoLeadingZero,
// });

const updateInfoSchema = t.Object({
  username: t.String({
    minLength: 3,
    description: "Username must be at least 3 characters",
  }),
  name: t.String({
    minLength: 2,
    description: "Name must be at least 2 characters",
  }),
  email: t.String({
    minLength: 3,
    description: "Email must be at least 3 characters",
  }),
  phone: t.String({
    minLength: 8,
    description: "Phone number must be at least 8 characters",
  }),
});

export type UpdateAccountInfoSchema = typeof updateInfoSchema.static;

const updatePasswordSchema = t.Object({
  currentPassword: t.String(),
  newPassword: t.String({
    minLength: 8,
    description: "New password must be at least 8 characters",
  }),
});

// type AddressSchema = {
//     label: string;
//     street: string;
//     lat: number;
//     lng: number;
//     note?: string | undefined;
// }

const addAddressSchema = t.Object({
  label: t.String({
    maxLength: 255,
    minLength: 3,
    error: "Label must be between 3 and 255 characters",
  }),
  street: t.String({
    maxLength: 255,
    minLength: 3,
    error: "Street must be between 3 and 255 characters",
  }),
  lat: t.Number({
    minimum: -90,
    maximum: 90,
    error: "Latitude must be between -90 and 90",
  }),
  lng: t.Number({
    minimum: -180,
    maximum: 180,
    error: "Longitude must be between -180 and 180",
  }),
  note: t.Nullable(
    t.String({ maxLength: 255, error: "Note must be at most 255 characters" })
  ),
});

export type AddAddressSchema = typeof addAddressSchema.static;

const updateAddressSchema = t.Object({
  label: t.Optional(
    t.String({
      maxLength: 255,
      minLength: 3,
      error: "Label must be between 3 and 255 characters",
    })
  ),
  street: t.Optional(
    t.String({
      maxLength: 255,
      minLength: 3,
      error: "Street must be between 3 and 255 characters",
    })
  ),
  lat: t.Optional(
    t.Number({
      minimum: -90,
      maximum: 90,
      error: "Latitude must be between -90 and 90",
    })
  ),
  lng: t.Optional(
    t.Number({
      minimum: -180,
      maximum: 180,
      error: "Longitude must be between -180 and 180",
    })
  ),
  note: t.Optional(
    t.String({ maxLength: 255, error: "Note must be at most 255 characters" })
  ),
});

export type UpdateAddressSchema = typeof updateAddressSchema.static;

export type UpdatePasswordSchema = typeof updatePasswordSchema.static;

const updatePhoneNumberSchema = t.Object({
  phoneNumber: t.String({
    minLength: 7,
    maxLength: 15,
    description: "Phone number must be between 7 and 15 characters",
  }),
});

export type UpdatePhoneNumberSchema = typeof updatePhoneNumberSchema.static;

export const accountModel = new Elysia({ name: "account/model" }).model({
  updateInfo: updateInfoSchema,
  updatePassword: updatePasswordSchema,
  addAddress: addAddressSchema,
  updateAddress: updateAddressSchema,
  updatePhoneNumber: updatePhoneNumberSchema,
});
