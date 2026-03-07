import { z } from "zod";

export const LoginFormSchema = z.object({
  identifier: z.string().nonempty("Please enter username or email"),
  password: z.string().nonempty("Please enter password"),
  otp: z.string().trim().length(6, "Invalid code").toUpperCase(),
});

export type LoginFormSchemaTypes = z.infer<typeof LoginFormSchema>;
