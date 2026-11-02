"use client";

import { useSession } from "@clerk/nextjs";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { useMemo } from "react";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

export type ClerkAccessTokenProvider = () => Promise<string | null>;

/**
 * Creates a browser Supabase client integrated with Clerk via the official
 * third-party `accessToken` callback option.
 */
export function createClient(
  getAccessToken?: ClerkAccessTokenProvider,
): SupabaseClient<Database> {
  const env = parseClientEnv();

  if (!isSupabaseClientConfigured(env)) {
    throw new Error(
      "Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        if (!getAccessToken) {
          return null;
        }
        return getAccessToken();
      },
    },
  );
}

/**
 * React hook returning a memoized browser Supabase client authenticated with
 * the active Clerk session token.
 */
export function useSupabaseBrowserClient(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo(
    () => createClient(async () => session?.getToken() ?? null),
    [session],
  );
}
