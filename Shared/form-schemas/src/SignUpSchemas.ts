import { z } from "zod";
import { parseISO, isValid, differenceInYears } from "date-fns";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(
    /^[A-Za-z0-9_\-.]+$/,
    "Username can only contain letters, numbers, dots, dashes, and underscores",
  );

const emailSchema = z.string().email("Invalid email address").max(100, "Maximum 100 characters");

const passwordSchema = z
  .string()
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[#?!@$%^&\-._]/, "Password must contain at least one special character (#?!@$%^&-._)")
  .regex(/^[A-Za-z0-9#?!@$%^&\-._]+$/, "Password contains invalid characters")
  .min(8, "Password must be at least 8 characters long")
  .max(64, "Password must be no more than 64 characters long");

const nameSchema = (nameType: string) => {
  return z
    .string()
    .trim()
    .nonempty(`${nameType} is required`)
    .max(64)
    .transform((val) => {
      if (val) return val[0].toUpperCase() + val.slice(1).toLowerCase();
      return val;
    });
};

const padDate = (date: string) => {
  const [year, month = "", day = ""] = date.split("-");

  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
};

const dateOfBirthSchema = z
  .string()
  .refine((val) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(padDate(val));
  }, "Invalid date")
  .refine((val) => {
    const normalized = padDate(val);
    const parsed = parseISO(normalized);
    const today = new Date();
    return isValid(parsed) && parsed <= today;
  }, "Invalid date")
  .refine((val) => {
    const normalized = padDate(val);
    const parsed = parseISO(normalized);
    const today = new Date();
    const age = differenceInYears(today, parsed);

    return age >= 13;
  }, "User must be older than 13")
  .transform((val) => padDate(val));

export const SignUpFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  otp: z.string().trim().length(6, "Invalid code").toUpperCase(),
  password: passwordSchema,
  confirmPassword: z.string().nonempty("Please enter password again"),
  firstname: nameSchema("Firstname"),
  lastname: nameSchema("Lastname"),
  dateOfBirth: dateOfBirthSchema,
});

export type SignUpFormSchemaTypes = z.infer<typeof SignUpFormSchema>;
