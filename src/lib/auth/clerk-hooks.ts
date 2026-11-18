"use client";

import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/nextjs";
import { isClerkClientConfigured } from "@/lib/env.client";

const CLERK_ENABLED = isClerkClientConfigured();

export interface SafeAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  getToken: () => Promise<string | null>;
}

export interface SafeUserState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ReturnType<typeof useClerkUser>["user"] | null;
}

/**
 * Returns Clerk auth state if Clerk publishable key is configured,
 * or a safe guest/unauthenticated fallback state if Clerk is unconfigured.
 */
export function useSafeAuth(): SafeAuthState {
  if (!CLERK_ENABLED) {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: async () => null,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkAuth = useClerkAuth();
  return {
    isLoaded: clerkAuth.isLoaded,
    isSignedIn: Boolean(clerkAuth.isSignedIn),
    userId: clerkAuth.userId ?? null,
    sessionId: clerkAuth.sessionId ?? null,
    getToken: () => clerkAuth.getToken(),
  };
}

/**
 * Returns Clerk user state if Clerk publishable key is configured,
 * or a safe guest/unauthenticated fallback state if Clerk is unconfigured.
 */
export function useSafeUser(): SafeUserState {
  if (!CLERK_ENABLED) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkUser = useClerkUser();
  return {
    isLoaded: clerkUser.isLoaded,
    isSignedIn: Boolean(clerkUser.isSignedIn),
    user: clerkUser.user,
  };
}
