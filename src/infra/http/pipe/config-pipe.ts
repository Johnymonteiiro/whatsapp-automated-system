import { z } from 'zod';

export const ConfigDTOSchema = z.object({
  prompt_template: z.string(),
  gpt_model: z.enum([
    'gpt-4o-mini',
    'gpt-4o-mini-2024-07-18',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0125',
  ]),
  max_tokens: z.number().int().positive(),
  temperature: z.number().min(0).max(1),
  embedding_model: z.enum([
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ]),
});

export type ConfigDTO = z.infer<typeof ConfigDTOSchema>;
