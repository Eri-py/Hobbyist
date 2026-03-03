import { z } from "zod";

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

  availableForTrade: z.boolean().optional(),

  lookingFor: z.string().trim().max(500, "Must be less than 500 characters").optional(),
});

export type CreateFormSchemaTypes = z.infer<typeof CreateFormSchema>;
