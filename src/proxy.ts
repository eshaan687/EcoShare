import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import { isProtectedRequestPath } from "@/lib/auth/proxy";
import { isClerkServerConfigured, parseServerEnv } from "@/lib/env.server";

/**
 * Official Clerk Next.js 16 request proxy (`clerkMiddleware`).
 * NOTE: Proxy is NOT the sole authorization boundary. Protected pages, Server Actions,
 * and PostgreSQL RLS enforce independent server-side (`auth()` + `user_roles`) and
 * database-level (`auth.jwt()->>'sub'`) checks.
 */
const configuredClerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRequestPath(request.nextUrl.pathname)) {
    await auth.protect();
  }
});

export async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const env = parseServerEnv();

  if (!isClerkServerConfigured(env)) {
    if (isProtectedRequestPath(request.nextUrl.pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
      loginUrl.searchParams.set("next", request.nextUrl.pathname);

      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set(
        "cache-control",
        "private, no-cache, no-store, max-age=0, must-revalidate",
      );
      return redirectResponse;
    }

    return NextResponse.next({ request });
  }

  return configuredClerkProxy(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
