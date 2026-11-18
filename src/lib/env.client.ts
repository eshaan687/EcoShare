import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY cannot be empty when provided")
    .optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1).default("/login"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1).default("/signup"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL")
    .optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot be empty when provided")
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty when provided")
    .optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function trimOrUndefined(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export function parseClientEnv(
  rawEnv: Record<string, string | undefined> = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): ClientEnv {
  const publishableKey =
    trimOrUndefined(rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    trimOrUndefined(rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: trimOrUndefined(rawEnv.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: trimOrUndefined(
      rawEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: trimOrUndefined(
      rawEnv.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    ),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: trimOrUndefined(
      rawEnv.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    ),
    NEXT_PUBLIC_SUPABASE_URL: trimOrUndefined(rawEnv.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
  });
}

export function isClerkClientConfigured(
  env: ClientEnv = parseClientEnv(),
): env is ClientEnv & {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
} {
  return Boolean(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_") ||
        env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_live_")),
  );
}

export function isSupabaseClientConfigured(
  env: ClientEnv = parseClientEnv(),
): env is ClientEnv & {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
} {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
