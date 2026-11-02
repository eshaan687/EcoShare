import "server-only";
import { z } from "zod";
import { parseClientEnv } from "@/lib/env.client";

const serverOnlyEnvSchema = z.object({
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

export function parseServerEnv(
  rawEnv: Record<string, string | undefined> = process.env,
): ServerEnv {
  const clientEnv = parseClientEnv(rawEnv);
  const normalizedServer = {
    SUPABASE_SERVICE_ROLE_KEY:
      rawEnv.SUPABASE_SERVICE_ROLE_KEY &&
      rawEnv.SUPABASE_SERVICE_ROLE_KEY.trim() !== ""
        ? rawEnv.SUPABASE_SERVICE_ROLE_KEY.trim()
        : undefined,
    RESEND_API_KEY:
      rawEnv.RESEND_API_KEY && rawEnv.RESEND_API_KEY.trim() !== ""
        ? rawEnv.RESEND_API_KEY.trim()
        : undefined,
  };

  const serverEnv = serverOnlyEnvSchema.parse(normalizedServer);
  return {
    ...clientEnv,
    ...serverEnv,
  };
}
