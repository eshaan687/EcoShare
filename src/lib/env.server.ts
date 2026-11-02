import "server-only";
import { z } from "zod";
import { parseClientEnv } from "@/lib/env.client";

const serverOnlyEnvSchema = z.object({
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "CLERK_SECRET_KEY cannot be empty when provided")
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY cannot be empty when provided")
    .optional(),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY cannot be empty when provided")
    .optional(),
});

export type ServerEnv = ReturnType<typeof parseClientEnv> &
  z.infer<typeof serverOnlyEnvSchema>;

function trimOrUndefined(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export function parseServerEnv(
  rawEnv: Record<string, string | undefined> = process.env,
): ServerEnv {
  const clientEnv = parseClientEnv(rawEnv);
  const serverEnv = serverOnlyEnvSchema.parse({
    CLERK_SECRET_KEY: trimOrUndefined(rawEnv.CLERK_SECRET_KEY),
    SUPABASE_SERVICE_ROLE_KEY: trimOrUndefined(
      rawEnv.SUPABASE_SERVICE_ROLE_KEY,
    ),
    RESEND_API_KEY: trimOrUndefined(rawEnv.RESEND_API_KEY),
  });

  return {
    ...clientEnv,
    ...serverEnv,
  };
}

export function isClerkServerConfigured(
  env: ServerEnv = parseServerEnv(),
): env is ServerEnv & {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
} {
  return Boolean(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY,
  );
}
