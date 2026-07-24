import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, dash, underscore only."),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Enter a valid email address."),
  role: z.nativeEnum(UserRole),
  temporaryPassword: z.string().min(10, "Temporary password must be at least 10 characters."),
});
