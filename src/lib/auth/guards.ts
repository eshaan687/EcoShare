import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, EcoShareRole } from "@/types/database.types";

export { sanitizeRedirectPath } from "@/lib/security/redirect";

export interface AuthenticatedActor {
  readonly userId: string;
  readonly sessionId: string | null;
}

export type ClerkServerAuthResolver = () => Promise<{
  userId: string | null;
  sessionId: string | null;
}>;

export type SupabaseServerClientFactory = () => Promise<
  Pick<SupabaseClient<Database>, "from">
>;

/**
 * Verifies the active Clerk user session on the server via @clerk/nextjs/server `auth()`.
 * Never trusts client-supplied user IDs.
 */
export async function requireAuthenticatedUser(
  resolveAuth: ClerkServerAuthResolver = () => auth(),
): Promise<AuthenticatedActor> {
  const { userId, sessionId } = await resolveAuth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  return {
    userId,
    sessionId,
  };
}

/**
 * Verifies the caller's Clerk session and queries `public.user_roles` directly from
 * PostgreSQL on the server for every privileged operation.
 * Never trusts client-supplied roles or cached metadata.
 */
export async function requireAuthorizedRole(
  allowedRoles: readonly EcoShareRole[],
  dependencies: {
    resolveAuth?: ClerkServerAuthResolver;
    getSupabaseClient?: SupabaseServerClientFactory;
  } = {},
): Promise<AuthenticatedActor & { readonly roles: readonly EcoShareRole[] }> {
  const actor = await requireAuthenticatedUser(dependencies.resolveAuth);
  const supabase = await (dependencies.getSupabaseClient ?? createClient)();

  const { data: roleRows, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", actor.userId);

  if (error) {
    throw new Error("Failed to verify user role permissions");
  }

  const assignedRoles = (roleRows ?? []).map((row) => row.role);
  const isAuthorized = assignedRoles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!isAuthorized) {
    throw new Error("Insufficient role permissions");
  }

  return {
    ...actor,
    roles: assignedRoles,
  };
}
