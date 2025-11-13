import { z } from "zod/v4";

// Schema for create post form
export const CreateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .nonempty("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),

  description: z
    .string()
    .trim()
    .nonempty("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),

  condition: z
    .number("Please select a condition")
    .min(0, "Please select a valid condition")
    .max(3, "Please select a valid condition"),

  availableForTrade: z.boolean().default(false),

  lookingFor: z.string().trim().max(500, "Must be less than 500 characters").optional(),
});

export type CreateFormSchemaTypes = z.infer<typeof CreateFormSchema>;
