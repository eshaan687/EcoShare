import { createRouteMatcher } from "@clerk/nextjs/server";

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

export const isClerkProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/impact",
  "/create(.*)",
  "/messages(.*)",
  "/notifications(.*)",
  "/bookmarks(.*)",
  "/profile(.*)",
  "/settings(.*)",
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
