# EcoShare — Phase 2 Architecture Specification

**Project:** EcoShare  
**Document Version:** 2.0  
**Status:** Approved Architecture Draft  
**Primary Role:** Lead Software Architect and Senior Full-Stack Engineer  
**Date:** November 2026  

---

## 1. System Overview & Executive Summary

EcoShare is a global environmental social network designed to inspire real-world sustainability action. Its mission is captured in its core message: **Share Actions. Inspire Change.**

Phase 1 successfully delivered a polished, responsive, and accessible Next.js 16 (React 19) frontend prototype, complete with Clerk authentication flows, comprehensive mock feeds, environmental challenge showcases, prototype impact submission modals, and verified contribution indicators.

Phase 2 transitions EcoShare from an in-memory UI prototype into a production-grade, secure, database-driven platform powered by **Clerk** (Authentication & Identity) and **Supabase** (PostgreSQL, Storage, and Realtime), deployed on **Vercel** with transactional notifications via **Resend**.

### Core Architecture Principles

1. **Security & Zero-Trust by Default:**
   All client interactions are treated as untrusted. Client-side claims (roles, user IDs, XP, status) are never trusted. All data access is strictly governed by PostgreSQL Row-Level Security (RLS) policies evaluating Clerk identity JWTs `(auth.jwt()->>'sub')`.
2. **Strict Separation of Social Engagement vs. Verified Impact:**
   Likes, comments, bookmarks, and ordinary social posts have zero environmental verification weight and cannot award XP, badges, or reputation. Environmental impact submissions undergo independent human verification by authorized verifiers or administrators.
3. **Transactional Integrity & Idempotency:**
   XP awards, level promotions, and badge unlocks are governed by atomic PostgreSQL stored procedures (`SECURITY DEFINER` RPCs) writing to an append-only, immutable `xp_ledger`.
4. **Native Clerk-Supabase Federation:**
   No duplicate user passwords or session synchronization hacks. We leverage Clerk's native Supabase third-party authentication integration where Supabase validates Clerk session tokens via Clerk's JWKS public keys.
5. **Private Evidence Isolation:**
   Impact evidence photos, videos, and receipts remain strictly private in the `private-impact-evidence` storage bucket. Evidence is never accessible to the public internet and is only retrievable via short-lived (60s) cryptographic signed URLs issued to the submitter and authorized verifiers.
6. **Graceful Degraded States & Prototype Continuity:**
   During development and incremental feature rollouts, pages gracefully fallback or clearly demarcate mock vs. live persistence without breaking build pipelines or unit/E2E test suites.

---

## 2. High-Level System Architecture & Component Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                        CLIENT TIER (BROWSER)                                      |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Next.js App Router (React 19 Server & Client Components, Tailwind CSS, Lucide Icons)        |  |
|  +---------------------------------------------------------------------------------------------+  |
|       |                                               |                             |             |
|       | 1. Auth & Session Management                  | 2. Server Actions / API     | 3. Direct   |
|       v                                               v                             |    Storage  |
|  +-------------------------+                   +-----------------------------+      |    Upload   |
|  | Clerk React Provider    |                   | Next.js Server Components   |      |    & Realtime
|  | - Sign In / Sign Up     |                   | & Server Actions            |      |             |
|  | - Session JWT Token     |                   | (src/app, src/lib/actions)  |      |             |
|  +-------------------------+                   +-----------------------------+      |             |
+---------------------------------------------------------------|---------------------|-------------+
                                                                |                     |
                                                                | Clerk JWT           |
                                                                v                     v
+---------------------------------------------------------------------------------------------------+
|                                       SUPABASE BACKEND CLOUD                                      |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Supabase PostgREST API & Storage API Gateway                                                |  |
|  | - Validates Clerk JWT against Clerk JWKS endpoint: https://<clerk-domain>/.well-known/jwks.json|
|  | - Extracts (auth.jwt()->>'sub') as authenticated caller user_id                            |  |
|  +---------------------------------------------------------------------------------------------+  |
|       |                                               |                             |             |
|       v                                               v                             v             |
|  +-------------------------+     +-------------------------------+   +-------------------------+  |
|  | PostgreSQL Database     |     | Supabase Storage Engine       |   | Supabase Realtime Engine|  |
|  | - 22 Tables (19 Core    |     | - avatars (public)            |   | - Notifications channel |  |
|  |   + 3 Operational/Audit)|     | - public-post-media (public)  |   | - Live messages channel |  |
|  | - Row-Level Security    |     | - private-impact-evidence     |   | - Challenge ticker      |  |
|  | - Atomic Verification   |     |   (strictly private, signed   |   +-------------------------+  |
|  |   Stored Procedures     |     |    URLs only)                 |                                |
|  | - Immutable xp_ledger   |     |                               |                                |
|  +-------------------------+     +-------------------------------+                                |
+---------------------------------------------------------------------------------------------------+
                                                                ^
                                                                | User Sync Webhook (svix)
+---------------------------------------------------------------+-----------------------------------+
|                                     EXTERNAL SERVICES TIER                                        |
|                                                                                                   |
|  +-------------------------+                   +-----------------------------+                    |
|  | Clerk Backend Engine    |                   | Resend Transactional Email  |                    |
|  | - Issues Session JWTs   |                   | - Verification alerts       |                    |
|  | - Webhook dispatch      |                   | - Weekly impact digests     |                    |
|  |   (user.created, etc.)  |                   | - Community invitations     |                    |
|  +-------------------------+                   +-----------------------------+                    |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Request & Data Flow Patterns

### 3.1 Public Read Requests (Explore Feed, Leaderboards)
1. Browser requests server-rendered route (e.g. `/explore` or `/challenges`).
2. Server component initializes `createClient()` from `@/lib/supabase/server`.
3. If unauthenticated, `accessToken` returns `null`; Supabase client executes anonymous PostgREST queries with `anon` role.
4. RLS policies allow `SELECT` on public posts, challenges, and public profiles.
5. Server Component streams rendered HTML to client.

### 3.2 Authenticated Write Requests (Social Post, Follow, Comment)
1. User submits form via Next.js Server Action with Zod payload validation.
2. Server Action fetches caller Clerk ID via `auth()` from `@clerk/nextjs/server`. If null, throws `UnauthorizedError`.
3. Server Action instantiates Supabase client with caller's Clerk token.
4. Supabase evaluates `(auth.jwt()->>'sub') = user_id` in RLS policy.
5. Row is inserted into `public.posts` or `public.post_comments`.
6. Server Action calls `revalidatePath('/home')` and returns payload.

### 3.3 Environmental Impact Submission & Verification Workflow
1. **Evidence Upload:** Submitter requests an upload signed URL or uploads directly to `private-impact-evidence/{userId}/{submissionId}/{fileName}` using client authenticated with Clerk token.
2. **Submission Creation:** Submitter calls Server Action to insert record in `public.impact_submissions` with `status = 'pending'`, `xp_awarded = 0`.
3. **Verifier Review:** Authorized Verifier (role `verifier` or `admin` verified via `public.user_roles`) navigates to `/admin`.
4. **Evidence Inspection:** Verifier retrieves temporary (60s TTL) signed URL for evidence assets via `supabase.storage.from('private-impact-evidence').createSignedUrl(path, 60)`.
5. **Atomic Verification:** Verifier clicks "Approve". Action invokes PostgreSQL RPC `approve_impact_submission(p_submission_id, p_verifier_id, p_xp_amount, p_feedback)`.
6. **Atomic Transaction Execution:**
   - Validates verifier role in `public.user_roles`.
   - Checks submission is `pending` (locks row with `FOR UPDATE` to prevent race conditions).
   - Updates submission: `status = 'approved'`, `verifier_id`, `verified_at`, `xp_awarded`.
   - Inserts immutable ledger entry into `public.xp_ledger`.
   - Recalculates user total XP and updates `public.profiles.total_xp` and `level`.
   - Checks and unlocks any eligible badges in `public.user_badges`.
   - Writes immutable entry to `public.verification_audit_log`.
   - Inserts row in `public.notifications` for submitter.
7. **Email Notification:** Server Action dispatches congratulatory email via Resend API to submitter.

---

## 4. Clerk ↔ Supabase Native Authentication Integration

### 4.1 Native Third-Party Integration Pattern
EcoShare uses Supabase's native third-party authentication integration with Clerk. 
Unlike legacy patterns that required custom JWT signing templates and shared secrets, Supabase natively validates Clerk session tokens using Clerk's JSON Web Key Set (JWKS).

- **Clerk Issuer URL:** Configured in Supabase Dashboard (Auth -> Third-Party Auth) pointing to Clerk's Frontend API URL.
- **Audience Claim:** Supabase is configured with the expected audience (or standard Clerk audience).
- **Public Key Resolution:** Supabase automatically fetches and caches Clerk's public keys from `https://<clerk-domain>/.well-known/jwks.json`.
- **Identity Evaluation in SQL:** Supabase injects the decoded Clerk JWT claims into the PostgreSQL transaction state. The authenticated Clerk User ID is accessible via:
  ```sql
  (auth.jwt()->>'sub')
  ```
- **Primary Key Matching:** In all EcoShare application tables, the user reference column is defined as:
  ```sql
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE
  ```
  *(Note: Clerk User IDs are strings matching `user_2...`, NOT PostgreSQL UUIDs. We do not use `auth.users`).*

### 4.2 Client Implementations

#### Browser Client (`src/lib/supabase/client.ts`)
```typescript
"use client";

import { useSession } from "@clerk/nextjs";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

export function useSupabaseBrowserClient(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo(() => {
    const env = parseClientEnv();
    if (!isSupabaseClientConfigured(env)) {
      throw new Error("Supabase browser client is not configured.");
    }
    return createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        async accessToken() {
          return session ? (await session.getToken()) : null;
        },
      }
    );
  }, [session]);
}
```

#### Server Client (`src/lib/supabase/server.ts`)
```typescript
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";
import type { Database } from "@/types/database.types";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const env = parseClientEnv();
  if (!isSupabaseClientConfigured(env)) {
    throw new Error("Supabase server client is not configured.");
  }
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        const clerkAuth = await auth();
        return clerkAuth.getToken();
      },
    }
  );
}
```

#### Trusted Admin Client (`src/lib/supabase/admin.ts`)
```typescript
import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database.types";

export function createAdminClient(): SupabaseClient<Database> {
  const env = parseServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin client requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

---

## 5. Clerk-to-Supabase Webhook & Synchronization Pipeline

To guarantee database consistency without relying on client-side profile creation, Clerk lifecycle events are captured via an authenticated Next.js Edge/Node API route (`/api/webhooks/clerk`).

```
+----------------+          +-------------------------+          +-----------------------+
|  Clerk Auth    |          | Next.js Webhook Route   |          | PostgreSQL Database   |
|  Event Trigger | -------> | /api/webhooks/clerk     | -------> | public.profiles       |
|  (User Signed) |  HTTPS   | (svix signature verify) |  Admin   | public.user_roles     |
+----------------+          +-------------------------+          +-----------------------+
```

### 5.1 Webhook Verification & Security Specifications
- **Signature Engine:** `svix` package.
- **Verification Headers:** `svix-id`, `svix-timestamp`, `svix-signature`.
- **Secret Management:** Verified against `CLERK_WEBHOOK_SECRET` stored in server environment variables.
- **Replay Protection:** Rejects events with timestamps older than 5 minutes (300 seconds).
- **Idempotency:** Webhook requests record `svix-id` in a dedicated `public.processed_webhook_events` table with a unique constraint. If an event ID has already been processed, the handler immediately returns `200 OK` without re-executing.

### 5.2 Handled Webhook Events
1. `user.created`:
   - Extracts `id`, `first_name`, `last_name`, `username`, `email_addresses`, `image_url`.
   - Inserts row into `public.profiles` with `total_xp = 0`, `level = 1`, `role = 'user'`.
   - Inserts default role `'user'` into `public.user_roles`.
2. `user.updated`:
   - Updates `display_name`, `avatar_url`, and `updated_at` in `public.profiles`.
3. `user.deleted`:
   - Soft-deletes or cascades deletion in `public.profiles`. Cascading foreign keys clean up associated content or anonymize impact submissions.

---

## 6. Realtime Architecture

EcoShare uses Supabase Realtime (PostgreSQL Replication via Phoenix Channels) for targeted live experiences:

1. **User Notifications Channel (`user-notifications:{userId}`):**
   - Broadcasts real-time events when an impact submission is approved, a post receives a comment, or a user earns a badge.
   - Filtered at the publication level by `user_id`.
2. **Direct Messaging Channel (`conversation:{conversationId}`):**
   - Subscribes active participants to `public.messages` table inserts.
   - Guarded by RLS: Non-members cannot establish a subscription.
3. **Live Challenge Progress Ticker (`challenge:{challengeId}`):**
   - Broadcasts updated metrics when verified impact submissions increment aggregate challenge metrics (e.g. "Total Trees Planted: 1,248").

---

## 7. Storage & Evidence Architecture

Storage is split into 3 distinct Supabase buckets with customized security and caching postures:

| Bucket Name | Public Access | Max File Size | Allowed MIME Types | Access Pattern |
|---|---|---|---|---|
| `avatars` | Yes | 2 MB | `image/jpeg`, `image/png`, `image/webp` | Direct public CDN URLs |
| `public-post-media` | Yes | 15 MB (images), 50 MB (videos) | `image/*`, `video/mp4`, `video/quicktime` | Direct public CDN URLs |
| `private-impact-evidence` | **NO (Strictly Private)** | 25 MB | `image/*`, `video/mp4`, `application/pdf` | **Signed URLs Only (Max 60s TTL)** |

### 7.1 Private Evidence Ingestion & Access Lifecycle
1. User creates submission draft.
2. File path is standardized: `{userId}/{submissionId}/{uuid}.{ext}`.
3. Storage RLS ensures only `{userId}` can upload to their own directory.
4. Verifiers and Admins query `createSignedUrl` using server client with verified credentials.
5. Signed URL expires in 60 seconds to prevent link leaking, proxy caching, or unauthorized sharing.
