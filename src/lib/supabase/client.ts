"use client";

import { useSession } from "@clerk/nextjs";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { useMemo } from "react";
import { useSafeAuth } from "@/lib/auth/clerk-hooks";
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
      "Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
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

/**
 * Safe hook returning a browser Supabase client when configured, or null in
 * unconfigured test/preview environments. Never throws if ClerkProvider is unmounted.
 */
export function useSafeSupabaseClient(): SupabaseClient<Database> | null {
  const { getToken, isSignedIn } = useSafeAuth();

  return useMemo(() => {
    const env = parseClientEnv();
    if (!isSupabaseClientConfigured(env)) {
      return null;
    }
    return createClient(async () => {
      if (!isSignedIn) {
        return null;
      }
      return getToken();
    });
  }, [getToken, isSignedIn]);
}
