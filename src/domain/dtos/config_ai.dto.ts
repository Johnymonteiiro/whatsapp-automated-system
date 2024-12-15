export class ConfigDTO {
  prompt_template: string;
  gpt_model:
    | 'gpt-4o-mini'
    | 'gpt-4o-mini-2024-07-18'
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-0125';
  max_tokens: number;
  temperature: number;
  embedding_model:
    | 'text-embedding-3-small'
    | 'text-embedding-3-large'
    | 'text-embedding-ada-002';
}
