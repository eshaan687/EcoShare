import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

const PROTECTED_PATH_PREFIXES = [
  "/home",
  "/impact",
  "/create",
  "/messages",
  "/notifications",
  "/bookmarks",
  "/profile",
  "/settings",
  "/admin",
] as const;

export function isProtectedRequestPath(pathname: string): boolean {
  // Publicly accessible approved impact record view: /impact/[id]
  if (/^\/impact\/[^/]+$/.test(pathname)) {
    return false;
  }

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function applyProxyCookiesAndCacheHeaders(
  sourceResponse: NextResponse,
  targetResponse: NextResponse,
): NextResponse {
  sourceResponse.cookies.getAll().forEach((cookie) => {
    targetResponse.cookies.set(cookie);
  });

  const cacheControl = sourceResponse.headers.get("cache-control");
  if (cacheControl) {
    targetResponse.headers.set("cache-control", cacheControl);
  } else {
    targetResponse.headers.set(
      "cache-control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
  }

  const vary = sourceResponse.headers.get("vary");
  if (vary) {
    targetResponse.headers.set("vary", vary);
  }

  return targetResponse;
}

/**
 * Refreshes the user's Supabase Auth session cookies and performs coarse redirect hygiene.
 * NOTE: Proxy is NOT the sole authorization boundary. Protected pages, Server Actions,
 * and PostgreSQL RLS enforce independent server-side and database-level checks.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const env = parseClientEnv();

  if (!isSupabaseClientConfigured(env)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verify and refresh JWT claims per current @supabase/ssr guidance.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  if (!claims && isProtectedRequestPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);

    const redirectResponse = NextResponse.redirect(loginUrl);
    return applyProxyCookiesAndCacheHeaders(supabaseResponse, redirectResponse);
  }

  return supabaseResponse;
}
