import 'dotenv/config';

import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  QUEUE_HOST: z.string(),
  QUEUE_PORT: z.coerce.number().default(6379),
  PORT: z.coerce.number().default(3333),
});

export type Env = z.infer<typeof envSchema>;

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('🛑 Invalid environment variable', _env.error.format());

  throw new Error('Invalid environment variable');
}

export const env = _env.data;
