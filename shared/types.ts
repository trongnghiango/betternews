import { z } from "zod";

export type SuccessResponse<T = void> = {
  success: true;
  message: string;
} & (T extends void ? {} : { data: T });

// const data: SuccessResponse<{ id: number }> = {
//   success: true,
//   message: "Post created",
//   data: { id: 1 },
// };

export type ErrorResponse = {
  success: false;
  error: string;
  isFormError?: boolean;
};

export const LoginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(31)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(3).max(255),
});
