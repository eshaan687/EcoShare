import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL")
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty when provided")
    .optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(
  rawEnv: Record<string, string | undefined> = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): ClientEnv {
  const normalized = {
    NEXT_PUBLIC_APP_URL:
      rawEnv.NEXT_PUBLIC_APP_URL && rawEnv.NEXT_PUBLIC_APP_URL.trim() !== ""
        ? rawEnv.NEXT_PUBLIC_APP_URL.trim()
        : undefined,
    NEXT_PUBLIC_SUPABASE_URL:
      rawEnv.NEXT_PUBLIC_SUPABASE_URL &&
      rawEnv.NEXT_PUBLIC_SUPABASE_URL.trim() !== ""
        ? rawEnv.NEXT_PUBLIC_SUPABASE_URL.trim()
        : undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== ""
        ? rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
        : undefined,
  };

  return clientEnvSchema.parse(normalized);
}

export function isSupabaseClientConfigured(
  env: ClientEnv = parseClientEnv(),
): env is ClientEnv & {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
} {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
