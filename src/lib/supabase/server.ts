import "server-only";
import { auth } from "@clerk/nextjs/server";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

/**
 * Creates a server-side Supabase client authenticated with the caller's Clerk
 * session token via the official third-party `accessToken` callback integration.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const env = parseClientEnv();

  if (!isSupabaseClientConfigured(env)) {
    throw new Error(
      "Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        const clerkAuth = await auth();
        return clerkAuth.getToken();
      },
    },
  );
}
