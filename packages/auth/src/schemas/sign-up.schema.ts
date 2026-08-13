import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.email(),
  password: z.string().min(8, 'At least 8 characters'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
