# EcoShare — Technical Architecture & Engineering Specification

**Version:** 1.0  
**Status:** Approved Architecture Direction  
**Platform:** Global Responsive Web Application  
**Frontend:** Next.js + TypeScript  
**Backend:** Supabase  
**Database:** PostgreSQL  
**Authentication:** Supabase Auth  
**Media:** Supabase Storage  
**Deployment:** Vercel  
**Repository:** GitHub

---

# 1. Architecture Overview

## 1.1 Architectural Goal

EcoShare must be engineered as a secure, scalable, maintainable environmental social network.

The architecture must support:

- Worldwide users.
- Social content and interactions.
- Photo and video uploads.
- Environmental contribution submissions.
- Private evidence verification.
- XP and achievement systems.
- Communities and challenges.
- Real-time notifications and messaging.
- Administrative operations.
- Future mobile applications.

The initial architecture should remain modular without introducing unnecessary infrastructure complexity.

Use a modular monolith rather than microservices for the initial release.

## 1.2 System Architecture

```text
                    ECO SHARE USERS
                          |
                          v
                NEXT.JS WEB APPLICATION
                React + TypeScript
                          |
             +------------+------------+
             |                         |
             v                         v
       SERVER COMPONENTS         CLIENT COMPONENTS
             |                         |
             +------------+------------+
                          |
                          v
                 SERVER-SIDE SERVICES
                          |
             +------------+------------+
             |            |            |
             v            v            v
          SUPABASE      MEDIA       EXTERNAL
           AUTH        UPLOADS      SERVICES
             |            |            |
             +------------+------------+
                          |
                          v
                  SUPABASE PLATFORM
                          |
             +------------+------------+
             |            |            |
             v            v            v
         PostgreSQL    Storage      Realtime
             |
             v
       ROW LEVEL SECURITY
             |
             v
       VERIFIED DATA ACCESS
```

This diagram is conceptual. Implement actual service boundaries according to the chosen Next.js and Supabase architecture.

---

# 2. Technology Stack

The following stack is approved for the initial implementation.

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Components | shadcn/ui where appropriate |
| Icons | Lucide React |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Hosting | Vercel |
| Source control | GitHub |
| Email delivery | Resend |
| Testing | Vitest, Playwright |
| Validation | Zod |
| Package manager | pnpm |

Use stable, mutually compatible versions at project initialization.

Record exact installed versions in the package manifest and lockfile.

Do not upgrade major dependencies automatically without evaluating compatibility.

---

# 3. Application Architecture

## 3.1 Next.js App Router

Use the Next.js App Router.

Organize the application around route groups and reusable feature modules.

Recommended initial structure:

```text
ecoshare/
│
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── explore/
│   │   ├── communities/
│   │   └── challenges/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── auth/
│   │
│   ├── (app)/
│   │   ├── home/
│   │   ├── impact/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── bookmarks/
│   │   ├── profile/
│   │   ├── communities/
│   │   ├── challenges/
│   │   └── settings/
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── submissions/
│   │   ├── users/
│   │   ├── reports/
│   │   └── audit-log/
│   │
│   ├── api/
│   │   └── webhooks/
│   │
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
│
├── components/
│   ├── branding/
│   ├── layout/
│   ├── feed/
│   ├── impact/
│   ├── profile/
│   ├── communities/
│   ├── challenges/
│   ├── gamification/
│   ├── messaging/
│   ├── notifications/
│   ├── admin/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── profiles/
│   ├── posts/
│   ├── comments/
│   ├── follows/
│   ├── impact/
│   ├── verification/
│   ├── gamification/
│   ├── communities/
│   ├── challenges/
│   ├── messaging/
│   └── notifications/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── auth/
│   ├── validation/
│   ├── security/
│   ├── storage/
│   ├── utils/
│   └── constants/
│
├── actions/
├── hooks/
├── types/
├── config/
├── tests/
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
├── public/
├── references/
│
├── AGENTS.md
├── ECOSHARE_PRD.md
├── ECOSHARE_DESIGN_SYSTEM.md
├── ECOSHARE_ARCHITECTURE.md
├── ECOSHARE_IMPLEMENTATION_PLAN.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

This is a recommended structure, not a requirement to create every directory immediately.

Only introduce files and directories when the corresponding milestone requires them.

## 3.2 Rendering Strategy

Prefer React Server Components for server-rendered data and static interface sections.

Use Client Components when interaction requires browser-side state, such as:

- Feed interactions.
- Upload progress.
- Search controls.
- Dialogs.
- Interactive tabs.
- Realtime subscriptions.
- Form interactions.

Do not mark entire pages as client-rendered unnecessarily.

Keep server-only logic out of client bundles.

---

# 4. Supabase Project Architecture

Supabase is the primary backend.

It provides:

1. PostgreSQL database.
2. Authentication.
3. Storage.
4. Realtime functionality.
5. Row Level Security.
6. Database functions.

## 4.1 Project Environments

Create separate Supabase projects for:

**Development**
- Local development and testing.
- Test users.
- Test media.
- Development migrations.

**Production**
- Real users.
- Real data.
- Production authentication.
- Production storage.

Preview deployments should use an isolated staging environment or a carefully controlled development environment.

Never connect an untrusted preview deployment to production credentials.

## 4.2 Database Region

Choose a primary database region based on expected user geography, latency and available Supabase regions.

Do not assume the database should be located in the same country as the developer.

Database region selection must be reviewed before production creation because changing regions later can require migration.

Use CDN delivery and appropriately configured media access to improve global performance.

---

# 5. Database Design

Use PostgreSQL with UUID primary keys.

Use foreign keys, indexes, unique constraints and timestamps appropriately.

Use `timestamptz` for timestamps.

Use database constraints to protect important invariants.

Avoid storing critical relational data in arbitrary JSON fields.

## 5.1 User Profiles

### profiles

Purpose: Public-facing user information.

Suggested fields:

- id: UUID, references auth.users.
- username: Unique username.
- display_name.
- bio.
- avatar_path.
- cover_path.
- country_code.
- region.
- website_url.
- created_at.
- updated_at.

Do not store passwords or authentication secrets here.

Avoid collecting precise residential addresses.

### user_roles

Purpose: Privileged role assignments.

Suggested fields:

- id.
- user_id.
- role.
- assigned_by.
- created_at.

Initial roles:

- user.
- moderator.
- verifier.
- admin.

Role assignment must be restricted to authorized administrative processes.

A user must never be able to assign themselves an administrator or verifier role.

---

## 5.2 Social Posts

### posts

Suggested fields:

- id.
- author_id.
- content.
- visibility.
- created_at.
- updated_at.
- deleted_at.

Visibility:

- public.
- followers.
- private.

### post_media

Suggested fields:

- id.
- post_id.
- storage_path.
- media_type.
- mime_type.
- file_size.
- width.
- height.
- duration_seconds.
- display_order.
- created_at.

Do not store large media files inside PostgreSQL.

Store file references and metadata only.

### likes

Suggested fields:

- id.
- post_id.
- user_id.
- created_at.

Create a unique constraint on `(post_id, user_id)`.

### comments

Suggested fields:

- id.
- post_id.
- author_id.
- parent_comment_id.
- content.
- created_at.
- updated_at.
- deleted_at.

### follows

Suggested fields:

- follower_id.
- following_id.
- created_at.

Use a unique constraint on `(follower_id, following_id)`.

Prevent following oneself.

### bookmarks

Suggested fields:

- id.
- user_id.
- post_id.
- created_at.

Use a unique constraint on `(user_id, post_id)`.

---

## 5.3 Environmental Impact

### impact_submissions

Purpose: Record environmental contribution submissions.

Suggested fields:

- id.
- user_id.
- title.
- description.
- category.
- activity_date.
- country_code.
- region.
- location_visibility.
- latitude, nullable.
- longitude, nullable.
- status.
- created_at.
- updated_at.
- submitted_at.

Initial statuses:

- draft.
- pending.
- under_review.
- approved.
- rejected.
- changes_requested.
- appealed.

Location information must be optional.

Do not publicly expose precise coordinates without explicit permission.

### impact_media

Purpose: Evidence attached to submissions.

Suggested fields:

- id.
- submission_id.
- storage_path.
- media_type.
- mime_type.
- file_size.
- created_at.

Evidence files must be stored privately.

### impact_verifications

Purpose: Record verifier decisions.

Suggested fields:

- id.
- submission_id.
- verifier_id.
- decision.
- reason.
- xp_awarded.
- created_at.

Possible decisions:

- approved.
- rejected.
- changes_requested.

Verification history must be preserved.

Do not overwrite previous decisions without maintaining an auditable history.

---

## 5.4 Gamification

### points_ledger

Purpose: Immutable record of XP transactions.

Suggested fields:

- id.
- user_id.
- amount.
- transaction_type.
- related_submission_id.
- description.
- created_at.

The ledger must be protected against unauthorized updates and duplicate awards.

### badges

Suggested fields:

- id.
- name.
- slug.
- description.
- image_path.
- criteria.
- is_active.
- created_at.

### user_badges

Suggested fields:

- id.
- user_id.
- badge_id.
- awarded_at.
- related_submission_id.

Create a unique constraint where appropriate to prevent duplicate badge awards.

Calculate current XP from the ledger or maintain a carefully controlled aggregate that can be reconciled against the ledger.

---

## 5.5 Communities

### communities

Suggested fields:

- id.
- name.
- slug.
- description.
- avatar_path.
- cover_path.
- visibility.
- created_by.
- created_at.
- updated_at.

### community_members

Suggested fields:

- id.
- community_id.
- user_id.
- role.
- joined_at.

Roles:

- member.
- moderator.
- owner.

Use unique constraints to prevent duplicate membership.

### community_posts

Suggested fields:

- id.
- community_id.
- author_id.
- content.
- created_at.
- updated_at.

Community content must follow community visibility and membership rules.

---

## 5.6 Challenges

### challenges

Suggested fields:

- id.
- title.
- slug.
- description.
- image_path.
- start_at.
- end_at.
- status.
- reward_xp.
- created_by.
- created_at.

### challenge_participants

Suggested fields:

- id.
- challenge_id.
- user_id.
- status.
- joined_at.
- completed_at.

Completion must be validated against the challenge's configured requirements.

Never award XP simply because a user changes their own participation status to completed.

---

## 5.7 Notifications

### notifications

Suggested fields:

- id.
- recipient_id.
- actor_id.
- notification_type.
- entity_type.
- entity_id.
- content.
- read_at.
- created_at.

Users must only access their own notifications.

Use appropriate indexes for recipient and creation date.

---

## 5.8 Messaging

### conversations

Suggested fields:

- id.
- created_at.
- updated_at.

### conversation_members

Suggested fields:

- conversation_id.
- user_id.
- joined_at.

### messages

Suggested fields:

- id.
- conversation_id.
- sender_id.
- content.
- created_at.
- edited_at.
- deleted_at.

Users must only access conversations in which they are authorized members.

Messages must not be exposed through public queries.

---

## 5.9 Moderation and Audit

### reports

Suggested fields:

- id.
- reporter_id.
- target_type.
- target_id.
- reason.
- details.
- status.
- assigned_to.
- created_at.
- resolved_at.

### audit_logs

Suggested fields:

- id.
- actor_id.
- action.
- entity_type.
- entity_id.
- metadata.
- created_at.

Audit logs should be append-only for ordinary application roles.

Avoid placing passwords, tokens or unnecessary personal information in logs.

---

# 6. Database Integrity and Indexing

Create indexes for frequently queried fields.

Initial index candidates:

- profiles.username.
- posts.author_id.
- posts.created_at.
- post_media.post_id.
- comments.post_id.
- likes.post_id.
- follows.follower_id.
- follows.following_id.
- impact_submissions.user_id.
- impact_submissions.status.
- impact_submissions.submitted_at.
- impact_media.submission_id.
- points_ledger.user_id.
- notifications.recipient_id.
- notifications.created_at.
- community_members.community_id.
- challenge_participants.challenge_id.
- messages.conversation_id.

Use composite indexes where query patterns justify them.

Do not create indexes indiscriminately.

Review query plans as the application grows.

---

# 7. Row Level Security

RLS is mandatory.

Enable Row Level Security on every exposed table.

Never assume that hiding a button or page in React protects data.

## 7.1 Profile Policies

- Public profile fields may be readable according to profile visibility.
- Users can update their own permitted profile fields.
- Users cannot change their own privileged roles.
- Administrative fields must not be writable through ordinary profile updates.

## 7.2 Post Policies

- Users can create posts as themselves.
- Users can edit their own posts.
- Users can delete or archive their own posts according to platform rules.
- Users can only view posts allowed by their visibility and relationship permissions.

## 7.3 Impact Policies

- Users can create and view their own private submissions.
- Users cannot approve their own submissions.
- Private evidence is only available to the owner and authorized verifiers or administrators.
- Users cannot modify verification decisions.
- Approved XP must not be client-controlled.

## 7.4 Messaging Policies

- Only conversation members can access conversation records.
- Only authorized members can read messages.
- Message insertion must verify the sender is a conversation member.

## 7.5 Administrative Policies

- Administrative access must be verified server-side.
- Privileged database operations must verify trusted role information.
- Service-role credentials must never be exposed to browsers.

## 7.6 RLS Testing

Write tests for both permitted and forbidden access.

Examples:

- User A cannot read User B's private evidence.
- User A cannot update User B's profile.
- User A cannot award themselves XP.
- Ordinary users cannot change role assignments.
- A verifier can review only submissions allowed by their permissions.
- Nonmembers cannot access private community content.
- Nonmembers cannot read private messages.

---

# 8. Authentication Architecture

Use Supabase Auth.

Use `@supabase/ssr` for Next.js cookie-based authentication.

Do not use deprecated Supabase Auth Helpers packages.

## 8.1 Authentication Providers

### Email and Password

Implement:
- Registration.
- Email verification.
- Login.
- Logout.
- Password recovery.
- Password update.

### Google

Configure Google OAuth in Supabase.

Use the correct Google Cloud OAuth credentials and redirect configuration.

### Apple

Configure Sign in with Apple.

Requirements may include:
- Apple Developer account.
- Services ID.
- Associated domain configuration.
- Sign in with Apple capability.
- Private key.
- Team ID.
- Key ID.

Use the official provider configuration.

Do not simulate Apple authentication.

## 8.2 Session Management

- Use secure cookie-based sessions.
- Refresh sessions through the supported Supabase SSR pattern.
- Validate users on the server.
- Do not rely on client-side session state for authorization.
- Avoid trusting unverified session claims.

Use `getClaims()` or `getUser()` as appropriate for the installed Supabase SDK and authorization requirements.

## 8.3 Authentication Callbacks

Implement secure callback handling.

Requirements:
- Validate callback parameters.
- Use configured redirect destinations.
- Prevent open redirects.
- Handle expired or invalid authentication flows.
- Provide understandable error states.

---

# 9. Media Storage Architecture

EcoShare supports photographs and videos from day one.

Use Supabase Storage.

## 9.1 Storage Buckets

Create the following buckets:

### avatars

Purpose:
- Profile photographs.

Access:
- Public or controlled delivery based on the finalized profile privacy model.

### public-post-media

Purpose:
- Publicly visible social post media.

Access:
- Public media delivery only for media explicitly intended for public viewing.

Private and followers-only content must not be exposed through unrestricted public objects.

### private-impact-evidence

Purpose:
- Environmental contribution evidence.

Access:
- Private.
- Owner and authorized reviewer access only.
- Short-lived signed URLs where appropriate.

Never expose private evidence through permanent public URLs.

## 9.2 Upload Requirements

Initial configurable limits:

- Maximum image size: 10 MB.
- Maximum video size: 100 MB.
- Maximum attachments per post: 5.

These are initial product defaults, not permanent infrastructure limits.

Support:
- JPG.
- PNG.
- WebP.
- MP4.
- Other formats only after deliberate compatibility review.

Validate actual file content and MIME types.

Do not rely exclusively on filename extensions.

## 9.3 Upload Process

1. User selects media.
2. Frontend validates basic file constraints.
3. Server or authorized upload process checks permissions.
4. File is uploaded to the correct bucket.
5. Upload progress is displayed.
6. Metadata is recorded.
7. The media is associated with the appropriate post or submission.
8. Failed uploads can be retried safely.

Use resumable uploads, such as TUS, for larger videos where appropriate.

Do not load entire large video files into application memory unnecessarily.

## 9.4 Media Processing

Plan for:
- Image resizing.
- Thumbnail generation.
- Video poster images.
- Video transcoding where necessary.
- Metadata extraction.
- Media moderation.
- Safe delivery.

Use background processing or an appropriate media service when needed.

Do not block the main application request while performing expensive media processing.

## 9.5 Metadata and Privacy

Remove sensitive EXIF metadata from public derivatives where practical.

Do not publicly reveal precise GPS metadata by default.

Keep original private evidence protected according to the retention policy.

---

# 10. Environmental Verification and XP Transactions

This is a critical business-logic boundary.

Verification and XP awarding must be implemented securely.

## 10.1 Verification Process

The server must:

1. Authenticate the acting verifier.
2. Confirm the verifier's authorization.
3. Load the target submission.
4. Confirm the submission is eligible for review.
5. Validate the requested decision.
6. Record the decision.
7. Update submission status.
8. Award XP if approved.
9. Record the points ledger transaction.
10. Update relevant achievement state.
11. Trigger notifications.

## 10.2 Transaction Safety

The status change and XP award must be handled atomically using appropriate PostgreSQL transaction logic.

Prevent:
- Duplicate XP awards.
- Concurrent approval races.
- Unauthorized approvals.
- Client-side XP manipulation.
- Repeated reward claims.

Use database constraints and trusted server-side operations.

A verification decision should not be partially successful.

## 10.3 Auditability

Record:
- Who reviewed the submission.
- What decision was made.
- When the decision occurred.
- The reason.
- The associated XP award.
- Any appeal or subsequent decision.

---

# 11. Server-Side Security

## 11.1 Secret Management

Use environment variables.

Never commit secrets.

Never expose:
- Supabase service-role key.
- OAuth client secrets.
- Apple private keys.
- Resend API keys.
- Other privileged credentials.

The service-role key must only exist in trusted server-side environments.

## 11.2 Environment Variables

Create `.env.example` containing placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=

RESEND_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

Use the current Supabase publishable key convention where applicable.

If OAuth credentials are configured directly in Supabase, do not duplicate them unnecessarily in application environment variables.

Never put real credentials in `.env.example`.

## 11.3 Validation

Use Zod or equivalent validation for untrusted input.

Validate:
- Request body.
- Query parameters.
- File metadata.
- IDs.
- User-generated text.
- Administrative actions.

## 11.4 Rate Limiting

Introduce rate limits for:
- Authentication attempts.
- Post creation.
- Comment creation.
- Message creation.
- Upload initiation.
- Impact submission.
- Report creation.

Use a rate-limiting strategy suitable for a distributed deployment.

Do not rely exclusively on in-memory limits in serverless environments.

## 11.5 Error Handling

Never expose:
- Stack traces.
- Database credentials.
- Internal SQL details.
- Authentication secrets.
- Sensitive storage paths.

Return useful, safe error messages.

Log diagnostic information server-side without storing unnecessary personal data.

---

# 12. API and Server Action Boundaries

Use Server Actions or Route Handlers where appropriate.

Keep business logic in reusable server-side service modules.

Suggested service boundaries:

- AuthService.
- ProfileService.
- PostService.
- CommentService.
- FollowService.
- ImpactSubmissionService.
- VerificationService.
- GamificationService.
- CommunityService.
- ChallengeService.
- NotificationService.
- MessagingService.
- ModerationService.

Do not place all business logic inside React components.

Do not allow a client request to determine privileged database operations.

Use explicit authorization checks for every sensitive operation.

---

# 13. Realtime Architecture

Use Supabase Realtime selectively.

Potential realtime functionality:

- New notifications.
- New messages.
- Conversation updates.
- Relevant feed updates.
- Verification status changes.

Do not subscribe every user to every table.

Use filtered subscriptions and appropriate authorization.

Handle:
- Subscription setup.
- Cleanup.
- Reconnection.
- Duplicate events.
- Network interruption.

Realtime updates must never bypass database permissions.

---

# 14. Search and Discovery Architecture

Initial search capabilities:

- Username search.
- Profile search.
- Post search.
- Community search.
- Challenge search.
- Environmental category search.

Use indexed PostgreSQL queries initially.

Consider PostgreSQL full-text search when appropriate.

Do not introduce an external search engine until actual performance or product requirements justify it.

Search results must respect privacy and visibility rules.

---

# 15. Email Architecture

Use Resend for transactional email where appropriate.

Email types:

- Email verification.
- Password recovery.
- Security notifications.
- Important account notifications.
- Optional activity notifications.

Create reusable email templates.

Authenticate the sending domain before production use.

Never expose email API credentials in the browser.

Avoid sending unnecessary marketing emails without appropriate consent and compliance review.

---

# 16. Testing Architecture

## 16.1 Unit Tests

Use Vitest for:
- Validation.
- XP calculations.
- Level calculations.
- Utility functions.
- Business rules.

## 16.2 Integration Tests

Test:
- Database operations.
- RLS.
- Authentication.
- Storage permissions.
- Verification transactions.
- Notification creation.

## 16.3 End-to-End Tests

Use Playwright.

Critical user journeys:

1. Register with email.
2. Verify email.
3. Sign in with Google in the configured test environment.
4. Complete onboarding.
5. Edit profile.
6. Create a social post.
7. Upload an image.
8. Upload a video.
9. Follow another user.
10. Like and comment.
11. Submit environmental evidence.
12. Review the submission as an authorized verifier.
13. Approve a valid contribution.
14. Confirm XP is awarded once.
15. Confirm the user receives a notification.
16. Confirm unauthorized users cannot access private evidence.

Apple authentication should also be tested using the actual configured provider before production release.

## 16.4 Accessibility Testing

Check:
- Keyboard navigation.
- Screen reader semantics.
- Focus management.
- Color contrast.
- Responsive behavior.

---

# 17. Deployment Architecture

## 17.1 GitHub

Use GitHub as the source of truth.

Recommended branches:

- `main`: production-ready code.
- `develop`: integration branch if needed.
- Feature branches: individual development tasks.

Protect the production branch.

Require successful checks before merging.

## 17.2 Vercel

Use:
- Development/local environment.
- Preview deployments.
- Production deployment.

Preview deployments must use appropriate nonproduction credentials.

Production environment variables must be configured separately.

## 17.3 Database Migrations

Use Supabase CLI migrations.

Store every schema change in version control.

Never rely on manually changing production schema without a corresponding migration.

Use the development project to test migrations before production.

Review destructive migrations carefully.

## 17.4 Domain

The EcoShare domain has not yet been purchased.

Until then:
- Use the assigned Vercel deployment domain.
- Configure development callback URLs.
- Avoid hardcoding a permanent domain.
- Keep application URL configuration centralized.

After domain purchase:
- Configure DNS.
- Enable HTTPS.
- Configure canonical URLs.
- Update Supabase authentication redirect URLs.
- Update Google OAuth redirect settings where required.
- Configure Apple associated domains where required.
- Authenticate the email sender domain.

---

# 18. Backups and Disaster Recovery

Database backups and media backups are separate concerns.

Plan for:

- PostgreSQL backups.
- Point-in-time recovery where available.
- Storage object backup.
- Database migration history.
- Recovery procedures.
- Credential rotation.
- Incident response documentation.

Do not assume a database backup automatically backs up Supabase Storage objects.

Test restoration procedures before production launch.

---

# 19. Performance and Scalability

Design for global use without premature complexity.

Initial priorities:

- Efficient SQL queries.
- Correct indexes.
- Pagination.
- Image optimization.
- Video upload handling.
- CDN-friendly media delivery.
- Server-side rendering where appropriate.
- Caching for suitable public content.
- Realtime subscriptions only where needed.

Avoid:
- Unnecessary microservices.
- Kubernetes at MVP stage.
- Multiple databases without a clear requirement.
- Premature distributed infrastructure.
- Excessive caching of private data.

Scale based on measured usage and performance.

---

# 20. Future Architecture Considerations

The architecture should leave room for:

- Native mobile applications.
- Organization accounts.
- NGO verification.
- Institutional dashboards.
- Environmental event management.
- Advanced analytics.
- Internationalization.
- Additional languages.
- Regional moderation.
- Environmental data integrations.
- Advanced contribution verification.

Do not build these features prematurely.

Keep business logic reusable and independent from specific UI components.

---

# 21. Architecture Acceptance Criteria

The architecture foundation is complete when:

1. Next.js application initializes successfully.
2. TypeScript is configured correctly.
3. Supabase development project is connected.
4. Server and browser clients are correctly separated.
5. Environment variable validation exists.
6. Database migrations are version-controlled.
7. Core database schema is reviewed.
8. RLS is enabled on exposed tables.
9. Critical authorization policies are tested.
10. Storage buckets and access policies are documented.
11. Authentication providers are configured or have documented setup requirements.
12. Service-role credentials remain server-only.
13. Automated test infrastructure exists.
14. GitHub repository is configured.
15. Vercel preview deployment works.
16. Documentation reflects the implemented architecture.

---

# 22. Mandatory Engineering Rules

Antigravity must follow these rules throughout development:

- Never expose privileged secrets.
- Never bypass RLS for convenience.
- Never trust client-supplied roles.
- Never award XP directly from client code.
- Never expose private environmental evidence.
- Never fabricate database values.
- Never create fake successful integrations.
- Never make undocumented production schema changes.
- Never overwrite existing project work without inspection.
- Never install unnecessary packages.
- Never silently change approved architecture.
- Never claim a test passed unless it was actually run.
- Never claim a feature is complete when it is only a visual prototype.

For every major implementation milestone:

1. Explain what will change.
2. Identify affected files and database objects.
3. Implement the change.
4. Run relevant tests.
5. Review security implications.
6. Inspect the interface.
7. Report completed work and remaining issues.

**Final engineering principle: Build EcoShare as a trustworthy environmental platform first, and scale its infrastructure as real usage demands.**
