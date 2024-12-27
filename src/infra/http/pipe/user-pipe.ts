import { z } from 'zod';

export const UserSchema = z.object({
  name: z.string().nonempty('Name cannot be empty'),
  email: z.string().email('Invalid email address').nullable(),
  password: z.string().max(8, 'Password must be at least 8 characters long'),
});

export type UserZodType = z.infer<typeof UserSchema>;
