import { z } from 'zod';

export const EnvironmentsSchema = z.object({
  name: z.string().nonempty('Name cannot be empty'),
  value: z.string().nonempty('Name cannot be empty'),
});

export type EnvironmentsZodType = z.infer<typeof EnvironmentsSchema>;
