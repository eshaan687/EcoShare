/**
 * Prevents open redirects during authentication callbacks by allowing only safe internal paths.
 */
export function sanitizeRedirectPath(
  nextParam: string | null | undefined,
  fallback = "/home",
): string {
  if (!nextParam) {
    return fallback;
  }

  const trimmed = nextParam.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  return trimmed;
}
