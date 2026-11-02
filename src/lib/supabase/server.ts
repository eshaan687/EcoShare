import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const env = parseClientEnv();

  if (!isSupabaseClientConfigured(env)) {
    throw new Error(
      "Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component where mutating cookies is not allowed.
            // Session refresh cookies are handled by src/proxy.ts.
          }
        },
      },
    },
  );
}
