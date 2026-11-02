import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database.types";

/**
 * Trusted server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Never import this module in Client Components (enforced via 'server-only').
 * Not required for ordinary Milestone 0 development or builds.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const env = parseServerEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server environment variables.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
