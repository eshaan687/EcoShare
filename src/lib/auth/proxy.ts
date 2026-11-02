import { createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that strictly require Clerk authentication at the request-proxy layer.
 *
 * Per Milestone 1 Technical Manager approval:
 * - `/home`, `/explore`, `/communities`, `/challenges`, `/u/[username]`, and the
 *   Milestone 1 prototype shell routes (`/impact`, `/messages`, `/notifications`,
 *   `/bookmarks`, `/settings`, `/profile`) are accessible in read-only guest preview
 *   mode with explicit sign-in prompts for protected actions and zero private data exposure.
 * - `/create`, `/profile/edit`, and `/admin` remain strictly protected at the proxy layer.
 */
const PROTECTED_PATH_PREFIXES = [
  "/create",
  "/profile/edit",
  "/admin",
] as const;

export const isClerkProtectedRoute = createRouteMatcher([
  "/create(.*)",
  "/profile/edit(.*)",
  "/admin(.*)",
]);

export function isProtectedRequestPath(pathname: string): boolean {
  // Publicly accessible approved impact record view: /impact/[id]
  if (/^\/impact\/[^/]+$/.test(pathname)) {
    return false;
  }

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
