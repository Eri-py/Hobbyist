import { z } from "zod/v4";

export const LoginFormSchema = z.object({
  identifier: z.string("Invalid username or email").nonempty("Please enter username or email"),
  password: z.string("Invalid password").nonempty("Please enter password"),
  otp: z.string("Invalid otp").trim().length(6, "Invalid otp"),
});

export type LoginFormSchemaTypes = z.infer<typeof LoginFormSchema>;
