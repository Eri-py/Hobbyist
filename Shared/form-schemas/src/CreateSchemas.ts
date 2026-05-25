import { z } from "zod";

export const CreateFormSchema = z
  .object({
    hobby: z
      .string()
      .trim()
      .nonempty("Hobby is required")
      .min(2, "Hobby must be at least 2 characters")
      .max(50, "Hobby must be less than 50 characters"),

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

    availableForTrade: z.boolean(),

    lookingFor: z.string().trim().max(500, "Must be less than 500 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.availableForTrade && !data.lookingFor?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lookingFor"],
        message: "Please describe what you're looking for.",
      });
    }
  });

export type CreateFormSchemaTypes = z.infer<typeof CreateFormSchema>;
