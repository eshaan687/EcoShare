import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EcoShareRole } from "@/types/database.types";

export { sanitizeRedirectPath } from "@/lib/security/redirect";

export interface AuthenticatedActor {
  readonly userId: string;
  readonly email: string | undefined;
}

/**
 * Verifies the active user session on the server.
 * Uses getUser() when fresh Auth server verification is required, or getClaims() for verified JWT claims.
 */
export async function requireAuthenticatedUser(options?: {
  verifyWithAuthServer?: boolean;
}): Promise<AuthenticatedActor> {
  const supabase = await createClient();

  if (options?.verifyWithAuthServer) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error("Authentication required");
    }
    return {
      userId: data.user.id,
      email: data.user.email,
    };
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    throw new Error("Authentication required");
  }

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
}

/**
 * Queries public.user_roles directly on the server for every privileged operation.
 * Never trusts client-supplied roles or unverified metadata.
 */
export async function requireAuthorizedRole(
  allowedRoles: readonly EcoShareRole[],
): Promise<AuthenticatedActor & { readonly roles: readonly EcoShareRole[] }> {
  const actor = await requireAuthenticatedUser({ verifyWithAuthServer: true });
  const supabase = await createClient();

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

