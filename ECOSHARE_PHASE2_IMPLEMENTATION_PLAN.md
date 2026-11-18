# EcoShare — Phase 2 Implementation Plan & Milestone Roadmap

**Project:** EcoShare  
**Document Version:** 2.0  
**Status:** Approved Implementation Roadmap Draft  
**Authority:** Product Owner Approved  
**Date:** November 2026  

---

## 1. Overview & Phased Migration Strategy

Phase 2 transforms EcoShare from an in-memory UI prototype into a production-grade, secure, database-powered platform.

To maintain development velocity, documentation integrity, and application stability, Phase 2 is decomposed into **five manageable, sequential sub-phases (Phase 2A through Phase 2E)**.

Each sub-phase defines:
1. Scoped functional objectives.
2. Direct dependencies and prerequisites.
3. Affected files and database migrations.
4. Acceptance criteria and verification gates.
5. Risk assessment and rollback strategies.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PHASE 2 ROADMAP EXECUTION                                            |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Phase 2A: Supabase Infrastructure & Clerk Webhook Auth Sync                                       |  |
|  | - Run initial database migrations (19 tables + RLS + helper functions)                            |  |
|  | - Configure Supabase native Clerk third-party auth                                                |  |
|  | - Implement /api/webhooks/clerk with svix signature verification                                  |  |
|  | - Verify live profile synchronization                                                             |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     |                                                   |
|                                                     v                                                   |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Phase 2B: Core Social Feed, Communities & Media Persistence                                       |  |
|  | - Replace mock posts in Home/Explore with Supabase PostgREST queries                              |  |
|  | - Wire public media uploads to Supabase Storage ('avatars', 'public-post-media')                  |  |
|  | - Implement live Likes, Comments, Bookmarks, and Follow/Unfollow Server Actions                   |  |
|  | - Implement community creation and membership join/leave actions                                 |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     |                                                   |
|                                                     v                                                   |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Phase 2C: Environmental Impact Submissions & Verification Pipeline                               |  |
|  | - Wire Submit Impact modal to write to public.impact_submissions                                  |  |
|  | - Secure evidence upload to 'private-impact-evidence' bucket with signed URLs                     |  |
|  | - Build live Verifier Queue in /admin with temporary 60s signed evidence URLs                     |  |
|  | - Implement atomic approve_impact_submission RPC with audit logging and anti-self-approval         |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     |                                                   |
|                                                     v                                                   |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Phase 2D: Environmental XP, Gamification, Badges & Reputation                                     |  |
|  | - Connect My Impact and Profile to immutable public.xp_ledger                                     |  |
|  | - Implement automated badge unlock triggers on milestone thresholds                               |  |
|  | - Implement challenge enrollment and live progress tracking                                       |  |
|  | - Deploy live global and community impact leaderboards                                            |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     |                                                   |
|                                                     v                                                   |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Phase 2E: Direct Messaging, Realtime Notifications, Resend Emails & Production Hardening           |  |
|  | - Implement 1-on-1 direct messaging and Supabase Realtime message streams                         |  |
|  | - Implement live notification center with Realtime publication filters                            |  |
|  | - Connect Resend transactional emails for impact approval and security notices                   |  |
|  | - Execute complete E2E Playwright test suite, RLS penetration tests, and performance audit        |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Milestone Breakdown & Detailed Specifications

---

### Phase 2A: Supabase Infrastructure & Clerk Webhook Auth Sync

**Primary Objective:**  
Establish database infrastructure, run complete schema migrations, configure native Clerk authentication in Supabase, and implement reliable webhook synchronization for user profiles.

#### Detailed Tasks:
1. **Database Schema Deployment:**
   - Execute Migration `001_initial_schema.sql` creating the 19 core tables, enums, indexes, and foreign keys.
   - Execute Migration `002_rls_policies.sql` applying row-level security and helper functions (`has_role`, `is_admin`, `is_verifier_or_admin`).
   - Execute Migration `003_storage_buckets.sql` provisioning `avatars`, `public-post-media`, and `private-impact-evidence`.
2. **Clerk Webhook Synchronization Route:**
   - Create `src/app/api/webhooks/clerk/route.ts` with `svix` signature validation.
   - Verify incoming payloads with `CLERK_WEBHOOK_SECRET`.
   - Implement handlers for `user.created`, `user.updated`, `user.deleted`.
   - Record processed `svix-id` in `public.processed_webhook_events` to ensure strict idempotency.
3. **Clerk Third-Party Authentication Configuration:**
   - Configure Supabase Dashboard with Clerk issuer domain and JWKS endpoint.
   - Verify that calls via `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` pass valid JWTs and resolve `(auth.jwt()->>'sub')`.
4. **Environment & Health Validation:**
   - Create healthcheck script to verify database connection, RLS status, and storage bucket availability.

#### Acceptance Criteria & Verification Gate:
- [ ] Database schema deployed with zero migration errors.
- [ ] RLS enabled on all 19 tables; queries without credentials are appropriately blocked.
- [ ] Creating a test user in Clerk triggers webhook and inserts row into `public.profiles` within 2 seconds.
- [ ] Browser and server Supabase clients successfully make authenticated queries returning the caller's profile.
- [ ] `pnpm typecheck`, `pnpm lint`, and unit tests pass with zero errors.

---

### Phase 2B: Core Social Feed, Communities & Media Persistence

**Primary Objective:**  
Replace prototype mock data in `/home`, `/explore`, and `/communities` with real database queries, image uploads, and interactive social relationships.

#### Detailed Tasks:
1. **Server Actions & Post Service:**
   - Implement `createPostAction` with Zod validation (`CreatePostSchema`).
   - Implement `uploadPublicMediaAction` uploading photos/videos to `public-post-media` bucket.
   - Implement feed fetching functions with cursor pagination (`getHomeFeed`, `getExploreFeed`).
2. **Social Interactions (Likes, Comments, Bookmarks):**
   - Implement `toggleLikeAction`, `addCommentAction`, and `toggleBookmarkAction`.
   - Update UI components to optimistic rendering backed by live Server Actions.
   - Validate that ordinary posts and likes never increment user XP or verified badge status.
3. **Follow Graph & Communities:**
   - Implement `followUserAction` and `unfollowUserAction` updating `public.follows`.
   - Implement community discovery and `joinCommunityAction` updating `public.community_members`.
   - Implement category and keyword search queries against `public.posts` and `public.communities`.

#### Acceptance Criteria & Verification Gate:
- [ ] Creating a post persists in `public.posts` and appears in the feed immediately.
- [ ] Attached images upload to `public-post-media` and render with Next.js Image component.
- [ ] Liking, commenting, and bookmarking persist across page refreshes and different user sessions.
- [ ] Following another user updates their follower count and filters the "Following" feed tab accurately.
- [ ] Playwright E2E tests for feed interactions pass across all viewports.

---

### Phase 2C: Environmental Impact Submissions & Verification Pipeline

**Primary Objective:**  
Implement the core mission experience: submitting verified environmental actions, securely storing private evidence, and providing an administrative verification workflow.

#### Detailed Tasks:
1. **Impact Submission Form & Private Storage:**
   - Wire `CreatePostDialog` (Submit Impact tab) to Server Action `submitImpactAction`.
   - Validate payload via `SubmitImpactSchema` (title, description, category, coordinates).
   - Implement private evidence upload to `private-impact-evidence/{userId}/{submissionId}/*`.
   - Ensure evidence bucket has `public: false` and reject unauthorized public URL generation.
2. **Admin Verification Queue (`/admin`):**
   - Query pending submissions from `public.impact_submissions` where `status = 'pending'`.
   - Enforce role check: Only users with `verifier` or `admin` in `public.user_roles` can view queue.
   - Generate short-lived signed URLs (60s TTL) for verifiers to inspect attached photos, videos, or documents.
3. **Atomic Verification Stored Procedure:**
   - Deploy `approve_impact_submission` and `reject_impact_submission` PostgreSQL RPCs.
   - Enforce anti-self-approval constraint (submitter cannot approve their own submission).
   - Atomic update: Submission marked `approved`, immutable entry created in `public.xp_ledger`, profile total XP recalculated, level updated, audit log created.
4. **Rejection & Feedback:**
   - Verifier can reject a submission with constructive feedback (`rejection_reason`).
   - Notification created informing submitter of the decision and feedback.

#### Acceptance Criteria & Verification Gate:
- [ ] User can submit an environmental action with private photo evidence.
- [ ] Evidence cannot be accessed via public browser URL (returns 403/404).
- [ ] Verifier in `/admin` can inspect evidence using temporary signed URLs.
- [ ] Clicking "Approve" triggers atomic RPC, awards specified XP, and updates submitter profile.
- [ ] Ordinary users cannot access `/admin` or invoke verification RPC (returns 403 Forbidden).
- [ ] Submitter cannot approve their own submission (database exception raised).

---

### Phase 2D: Environmental XP, Gamification, Badges & Reputation

**Primary Objective:**  
Activate the trusted reputation engine: display append-only XP history, calculate levels dynamically, unlock milestone badges, and render live leaderboards.

#### Detailed Tasks:
1. **XP Ledger Rollups & User Profiles:**
   - Connect `/impact` ("My Impact") and `/profile` to live queries from `public.xp_ledger`.
   - Display transparent audit trail of every verified impact event.
   - Calculate user level dynamically based on approved EcoShare 6-tier XP thresholds:
     - Level 1 — Eco Starter: 0 XP
     - Level 2 — Good Collector: 50 XP
     - Level 3 — Eco Guardian: 150 XP
     - Level 4 — Planet Protector: 350 XP
     - Level 5 — Earth Champion: 700 XP
     - Level 6 — Planet Legend: 1500 XP
2. **Automated Badge Unlocking:**
   - Create stored procedure or trigger `evaluate_user_badges(user_id)`:
     - First Action Badge ("Seedling"): Awarded on 1st verified submission.
     - Tree Master Badge: Awarded on 5 verified reforestation submissions.
     - Clean Waters Badge: Awarded on 5 verified ocean/waterway cleanups.
     - Century Club: Awarded upon reaching 1,000 verified XP.
   - Insert unlocked badges into `public.user_badges`.
3. **Challenge Participation & Completion:**
   - Implement `joinChallengeAction` inserting into `public.challenge_participants`.
   - Link impact submissions to active challenges.
   - Automatically complete challenge when verified impact satisfies requirements.
4. **Impact Leaderboards:**
   - Implement weekly, monthly, and all-time leaderboards querying `public.profiles` ordered by `total_xp DESC`.
   - Add community-level leaderboards aggregating verified impact among community members.

#### Acceptance Criteria & Verification Gate:
- [ ] Profile XP and level accurately reflect the sum of `public.xp_ledger`.
- [ ] No client can directly write or spoof XP (zero direct write policies on `xp_ledger`).
- [ ] Verified submissions correctly trigger badge awards displayed on `/badges`.
- [ ] Challenges show active participant counts and completion status.
- [ ] Unit and integration tests verify XP calculations and badge progression.

---

### Phase 2E: Direct Messaging, Realtime Notifications, Resend Emails & Production Hardening

**Primary Objective:**  
Implement realtime communication, deliver transactional emails, conduct security audits, and harden the entire application for production deployment.

#### Detailed Tasks:
1. **Direct Messaging & Conversations:**
   - Implement `sendMessageAction` writing to `public.messages`.
   - Subscribe conversation view to Supabase Realtime channel (`conversation:{id}`).
   - Enforce RLS: Non-participants cannot view messages or listen to the realtime stream.
2. **Realtime Notifications:**
   - Subscribe user to `user-notifications:{userId}` Realtime channel.
   - Display live toasts and unread badge counts in navigation bar when impact is approved or comments arrive.
3. **Transactional Emails via Resend:**
   - Configure Resend SDK (`resend` package).
   - Send transactional emails on key events:
     - Verification approval confirmation with XP summary.
     - Submission review status updates.
     - Weekly impact summary digest.
4. **Security Penetration Testing & Production Hardening:**
   - Run automated security tests verifying:
     - User A cannot access User B's private evidence.
     - Non-admin cannot elevate roles or approve impact submissions.
     - Tampered JWTs are rejected.
     - SQL injection and XSS payloads are neutralized.
   - Execute full Playwright E2E suite across all 7 viewports (360px to 1440px).
   - Validate lighthouse performance, accessibility (WCAG AA), and asset caching.

#### Acceptance Criteria & Verification Gate:
- [ ] Direct messages deliver in realtime (< 500ms latency) without page reload.
- [ ] Notifications update live on screen upon event occurrence.
- [ ] Resend successfully delivers transactional verification email in sandbox/production.
- [ ] All security penetration tests pass with zero vulnerabilities.
- [ ] Playwright E2E suite passes 100% across all viewports.
- [ ] Production build succeeds with optimal bundle splitting.

---

## 3. Risk Management & Rollback Strategy

| Identified Risk | Severity | Mitigation Strategy | Rollback Procedure |
|---|---|---|---|
| **Clerk Webhook Failure or Latency** | High | Implement local `syncProfileOnLogin` fallback in server client if profile is missing; use `svix-id` idempotency table. | Re-dispatch missed events from Clerk Webhook Dashboard. |
| **Private Evidence URL Leakage** | Critical | Enforce private bucket posture (`public: false`), max 60s signed URL expiration, zero client persistence. | Invalidate signed URLs by rotating Supabase storage signing keys. |
| **XP Race Conditions / Duplicate Awarding** | High | Use atomic PostgreSQL stored procedure `approve_impact_submission` with row locking (`FOR UPDATE`) and idempotency checks. | Revert submission status to `pending`, delete specific ledger row, and recalculate `total_xp`. |
| **Realtime Channel Flooding / Memory Leaks** | Medium | Limit realtime subscriptions to active UI views; clean up subscriptions in `useEffect` return hooks; rate limit message dispatches. | Disable realtime broadcast fallback to standard polling or manual refresh. |
| **Database Migration Glitch** | High | Write reversible migrations with explicit down-scripts; test all migrations on local/staging Supabase instance first. | Execute corresponding down-migration script or restore point-in-time backup. |
