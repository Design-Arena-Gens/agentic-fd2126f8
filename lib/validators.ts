import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = registerSchema;

export const studyPlanSchema = z.object({
  title: z.string().min(3),
  durationValue: z.coerce.number().min(1),
  durationUnit: z.enum(["days", "weeks", "months"])
});

export const progressUpdateSchema = z.object({
  planId: z.string().uuid(),
  dayId: z.string().uuid(),
  completed: z.boolean(),
  notes: z.string().max(500).nullable()
});
