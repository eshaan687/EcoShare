# EcoShare — Master Implementation Roadmap

**Version:** 1.0  
**Status:** Approved Development Plan  
**Project:** EcoShare  
**Development Approach:** Milestone-based implementation  
**Primary Objective:** Build a production-quality global environmental social network.

---

# 1. Development Philosophy

EcoShare must be developed through clearly defined milestones.

Each milestone must produce a working, testable increment of the application.

The development team must prioritize:

1. Correct architecture.
2. Security.
3. Functional completeness.
4. Visual accuracy.
5. Responsive behavior.
6. Performance.
7. Maintainability.

Do not prioritize the number of generated files or features over quality.

## 1.1 Development Rules

- Complete one milestone at a time.
- Inspect the existing project before making changes.
- Never overwrite existing work without reviewing it.
- Keep documentation updated.
- Use version control.
- Test every significant feature.
- Review security before merging.
- Compare implemented screens against the official design reference.
- Obtain product-owner approval at major milestones.

## 1.2 Definition of Milestone Completion

A milestone is complete only when:

- Required functionality works.
- Database changes are implemented through migrations.
- Security policies are tested.
- UI is responsive.
- Loading and error states exist.
- Relevant automated tests pass.
- No critical errors remain.
- Documentation is updated.
- The implementation report is delivered.

A visually complete but nonfunctional screen does not count as a completed feature.

---

# 2. Development Environment Setup

## Milestone 0 — Project Foundation

<badge>Foundation</badge>

### Objective

Establish a clean, secure and reproducible development environment.

### Tasks

**Repository**
- Initialize Git.
- Create a private GitHub repository.
- Configure `.gitignore`.
- Configure the default branch.
- Establish commit conventions.

**Frontend**
- Initialize Next.js App Router.
- Configure TypeScript.
- Configure Tailwind CSS.
- Install and configure shadcn/ui where appropriate.
- Configure Lucide React.
- Configure Inter typography.
- Establish ESLint and formatting rules.

**Backend**
- Create Supabase development project.
- Connect the Next.js application.
- Install and configure Supabase SSR clients.
- Separate browser and server clients.
- Configure environment variables.

**Documentation**
- Review all five EcoShare specification files.
- Create a README.
- Document setup instructions.
- Document architecture decisions.

**Testing**
- Configure Vitest.
- Configure Playwright.
- Confirm the application builds.
- Confirm linting works.

### Deliverables

- Working Next.js application.
- Git repository.
- Supabase development connection.
- Environment variable template.
- Initial test infrastructure.
- Documentation foundation.

### Acceptance Criteria

- Application starts locally.
- Application builds successfully.
- TypeScript checks pass.
- Supabase connection works.
- No privileged secrets are exposed.
- Git ignores local secrets.
- Initial automated tests execute successfully.

**Approval gate:** Do not begin the full application interface until the foundation is reviewed.

---

# 3. Design System and Interface Foundation

## Milestone 1 — EcoShare UI Foundation

### Objective

Reproduce the official EcoShare visual identity and establish reusable interface components.

### Tasks

**Branding**
- EcoShare logo.
- Wordmark.
- Brand colors.
- Typography.
- Iconography.

**Design tokens**
- Color variables.
- Typography scale.
- Spacing system.
- Border radius.
- Shadows.
- Breakpoints.
- Component dimensions.

**Layout**
- Application shell.
- Desktop sidebar.
- Top navigation.
- Main content container.
- Right contextual panel.
- Mobile header.
- Mobile bottom navigation.

**Reusable components**
- Buttons.
- Cards.
- Avatars.
- Badges.
- Tabs.
- Inputs.
- Dropdowns.
- Dialogs.
- Skeletons.
- Notifications.
- Progress bars.

### Screens to implement

1. Desktop application shell.
2. Mobile application shell.
3. Welcome/onboarding screen.
4. Login screen.
5. Signup screen.
6. Responsive navigation.

### Visual Testing

Test at:

- 360px.
- 390px.
- 430px.
- 768px.
- 1024px.
- 1280px.
- 1440px.

Compare the actual implementation against the official EcoShare reference image.

### Deliverables

- Centralized design tokens.
- Reusable component library.
- Responsive application shell.
- Initial public and authentication interfaces.

### Acceptance Criteria

- Design matches the approved direction.
- No horizontal overflow.
- Navigation behaves correctly.
- Components are reusable.
- Mobile and desktop layouts work.
- Keyboard focus states exist.

**Approval gate:** Product owner approves the visual foundation.

---

# 4. Database and Authentication

## Milestone 2 — Backend and Identity

### Objective

Establish the secure user identity and database foundation.

### Database tasks

Create version-controlled migrations for:

- profiles.
- user_roles.
- posts.
- post_media.
- follows.
- likes.
- comments.
- bookmarks.
- impact_submissions.
- impact_media.
- impact_verifications.
- points_ledger.
- badges.
- user_badges.
- communities.
- community_members.
- challenges.
- challenge_participants.
- conversations.
- conversation_members.
- messages.
- notifications.
- reports.
- audit_logs.

Create appropriate:
- Foreign keys.
- Unique constraints.
- Indexes.
- Timestamps.
- Database functions.
- Triggers only where justified.

Do not expose the entire schema immediately if features have not reached implementation.

### Security tasks

- Enable RLS on exposed tables.
- Implement ownership policies.
- Implement role-based access.
- Protect private evidence.
- Protect administrative operations.
- Test unauthorized access.

### Authentication tasks

Implement:

1. Email registration.
2. Email verification.
3. Email login.
4. Google login.
5. Apple login.
6. Password recovery.
7. Logout.
8. Session refresh.
9. Protected routes.
10. Account settings.

### Profile tasks

- Create profile automatically after registration.
- Username validation.
- Profile editing.
- Avatar upload.
- Basic profile visibility settings.

### Deliverables

- Version-controlled database migrations.
- Working authentication.
- User profile system.
- Protected application routes.
- Tested RLS policies.

### Acceptance Criteria

- All configured authentication methods work.
- Sessions persist securely.
- Users cannot access other users' private data.
- Users cannot modify privileged roles.
- Authentication failures are handled properly.

**Approval gate:** Review database design and security before building the social platform.

---

# 5. Social Platform Core

## Milestone 3 — Social Experience

### Objective

Build the fundamental social networking experience.

### Features

**Posts**
- Create text posts.
- Edit own posts.
- Delete own posts.
- View posts.
- Support visibility settings.

**Feed**
- For You.
- Following.
- Verified Impact.

**Interactions**
- Likes.
- Comments.
- Comment replies.
- Bookmarks.
- Sharing.
- Follow and unfollow.

**Profiles**
- Public profile.
- Profile statistics.
- Posts tab.
- Impact tab.
- Badges tab.
- About tab.

**Explore**
- Search users.
- Search posts.
- Discover content.
- Category filtering.

### Backend requirements

- Pagination.
- Correct visibility enforcement.
- Database indexes.
- Duplicate interaction prevention.
- Authorization checks.
- Safe handling of deleted content.

### Deliverables

A functioning social network with real user-generated content.

### Acceptance Criteria

- Users can publish and interact with posts.
- Following relationships work.
- Feed queries respect visibility.
- Profile information is correct.
- No fake engagement metrics.
- Database operations are tested.

**Approval gate:** Demonstrate the social experience with at least two separate test accounts.

---

# 6. Media Infrastructure

## Milestone 4 — Photo and Video System

### Objective

Implement reliable media upload and delivery.

### Tasks

**Storage**
- Configure avatar bucket.
- Configure public post media.
- Configure private impact evidence.
- Implement storage policies.

**Upload functionality**
- Image upload.
- Video upload.
- Multiple attachments.
- Drag and drop.
- File selection.
- Upload progress.
- Retry.
- Cancel.
- Remove attachment.

**Media processing**
- Image optimization.
- Thumbnail generation.
- Video previews.
- Appropriate metadata handling.
- Safe media delivery.

**Validation**
- File size.
- Actual MIME type.
- File type.
- Upload authorization.
- Ownership.
- Storage path validation.

### Initial limits

- Images: 10 MB.
- Videos: 100 MB.
- Maximum post attachments: 5.

These limits must be configurable.

Use resumable uploads for larger videos where appropriate.

### Deliverables

- Working image uploads.
- Working video uploads.
- Media gallery.
- Profile photographs.
- Secure private evidence storage.

### Acceptance Criteria

- Images upload correctly.
- Videos upload correctly.
- Failed uploads can be retried.
- Private evidence cannot be accessed by unauthorized users.
- Public media is delivered correctly.
- Upload progress is visible.
- Media does not unnecessarily block application performance.

**Approval gate:** Test real uploads on desktop and mobile.

---

# 7. Environmental Impact System

## Milestone 5 — Impact Submission and Verification

<badge color="success">Core differentiator</badge>

### Objective

Implement the environmental contribution verification workflow.

### User experience

Build:

- My Impact dashboard.
- Submit an environmental action.
- Contribution category selector.
- Activity description.
- Activity date.
- Optional location.
- Evidence uploader.
- Submission history.
- Submission details.
- Verification status.

### Verifier experience

Build:

- Verification queue.
- Pending submissions.
- Submission detail view.
- Evidence preview.
- Approve.
- Reject.
- Request changes.
- Review history.
- Appeal handling.

### Backend workflow

Implement the complete state machine:

```text
DRAFT
  |
  v
PENDING
  |
  v
UNDER_REVIEW
  |
  +------> APPROVED
  |
  +------> REJECTED
  |
  +------> CHANGES_REQUESTED
                    |
                    v
              RESUBMITTED
                    |
                    v
                PENDING

REJECTED
   |
   v
 APPEALED
```

Implement allowed transitions explicitly.

### Security

- Only the owner can manage their own draft.
- Only authorized verifiers can review assigned submissions.
- Users cannot approve their own submissions.
- Users cannot award XP themselves.
- Private evidence remains protected.
- Every verification decision is auditable.

### Deliverables

- Working submission workflow.
- Verifier dashboard.
- Review history.
- Secure evidence access.
- Notifications for status changes.

### Acceptance Criteria

- Submission creation works.
- Evidence uploads work.
- Verification decisions persist.
- Invalid state transitions are rejected.
- Unauthorized review attempts fail.
- Appeal workflow works.
- No private evidence leakage.

**Approval gate:** Complete a full submission and verification demonstration.

---

# 8. Gamification and Reputation

## Milestone 6 — XP, Levels and Badges

### Objective

Build the environmental achievement system.

### Tasks

- XP ledger.
- XP transaction service.
- Level calculation.
- Progress bars.
- Badge definitions.
- Badge awards.
- User achievement history.
- Profile reputation display.

### Initial levels

| Level | Name | XP |
|---|---|---:|
| 1 | Eco Starter | 0 |
| 2 | Good Collector | 50 |
| 3 | Eco Guardian | 150 |
| 4 | Planet Protector | 350 |
| 5 | Earth Champion | 700 |
| 6 | Planet Legend | 1500 |

### Rules

- XP is earned only through approved eligible contributions.
- XP rules are configurable.
- Duplicate awards are prevented.
- Every award is recorded.
- XP cannot be modified through client-side requests.
- Administrative adjustments must be audited.

### Deliverables

- Functional XP system.
- Level progression.
- Badge collection.
- Profile achievements.
- Gamification dashboard.

### Acceptance Criteria

- XP updates correctly.
- Duplicate approval cannot duplicate XP.
- Level progression is accurate.
- Badges are awarded according to rules.
- Ledger totals can be reconciled.

**Approval gate:** Verify the entire XP lifecycle using test submissions.

---

# 9. Communities and Challenges

## Milestone 7 — Community Platform

### Objective

Allow users to collaborate through environmental groups and initiatives.

### Communities

- Create community.
- Edit community.
- Join community.
- Leave community.
- Public communities.
- Private communities.
- Community posts.
- Membership roles.
- Community moderation.

### Challenges

- Browse challenges.
- View challenge details.
- Join challenges.
- Track participation.
- Submit completion evidence.
- Display challenge progress.
- Award eligible rewards.

### Deliverables

- Community directory.
- Community pages.
- Membership system.
- Challenge directory.
- Challenge detail pages.
- Participation tracking.

### Acceptance Criteria

- Membership permissions work.
- Private communities remain private.
- Challenge dates are respected.
- Completion requirements are validated.
- Rewards cannot be self-awarded.

**Approval gate:** Demonstrate a complete community participation journey.

---

# 10. Communication and Notifications

## Milestone 8 — Communication System

### Objective

Connect users through notifications and messaging.

### Notifications

Implement:
- New follower.
- Likes.
- Comments.
- Replies.
- Impact submission status.
- Badge unlocked.
- Level achieved.
- Community activity.
- Challenge updates.
- Messages.

### Messaging

Implement:
- Conversation creation.
- Conversation list.
- One-to-one messaging.
- Message history.
- Read status where appropriate.
- Realtime updates.
- Blocking and reporting.

### Email

Integrate transactional email for:
- Email verification.
- Password recovery.
- Important account security events.
- Optional notifications.

### Deliverables

- Notification center.
- Realtime messaging.
- Email integration.
- User notification preferences.

### Acceptance Criteria

- Notifications reach the correct users.
- Read status persists.
- Unauthorized users cannot access conversations.
- Realtime subscriptions clean up properly.
- Email integration works with real provider credentials.

**Approval gate:** Demonstrate communication between two separate test accounts.

---

# 11. Administration and Moderation

## Milestone 9 — Administrative Platform

### Objective

Create a secure administrative control center.

### Dashboard

Display real metrics:

- Total users.
- Active users.
- Posts.
- Pending submissions.
- Approved submissions.
- Rejected submissions.
- Communities.
- Challenges.

### User management

- Search accounts.
- View account status.
- Suspend accounts.
- Restore accounts.
- Assign authorized roles.
- Review account history.

### Content moderation

- Review reports.
- Hide inappropriate content.
- Resolve reports.
- Escalate cases.
- Record moderation actions.

### Verification management

- Manage verifier permissions.
- Review submissions.
- Monitor review queues.
- Review appeal cases.

### Audit

- Administrative actions.
- Verification decisions.
- Role changes.
- Account suspensions.
- Important system events.

### Deliverables

- Administrative dashboard.
- Moderation panel.
- User management.
- Verification administration.
- Audit log.

### Acceptance Criteria

- Only authorized administrators can access privileged features.
- All administrative actions are audited.
- Dashboard values come from real data.
- Role changes are secure.
- Moderation actions persist correctly.

**Approval gate:** Conduct a full permissions and security review.

---

# 12. Production Readiness

## Milestone 10 — Testing, Optimization and Launch

### Objective

Prepare EcoShare for real worldwide users.

### Functional testing

Test:
- Registration.
- Login.
- Google authentication.
- Apple authentication.
- Profile editing.
- Post creation.
- Media uploads.
- Social interactions.
- Impact submissions.
- Verification.
- XP.
- Communities.
- Challenges.
- Messaging.
- Notifications.
- Administration.

### Security testing

Test:
- RLS policies.
- Role escalation.
- Private media access.
- Authentication callbacks.
- Input validation.
- Upload restrictions.
- Rate limiting.
- Session handling.
- Authorization boundaries.

### Performance

Review:
- Page loading.
- Image optimization.
- Video handling.
- Database queries.
- Pagination.
- Mobile performance.
- Realtime connection usage.

### Accessibility

Review:
- Keyboard navigation.
- Screen reader support.
- Color contrast.
- Focus management.
- Forms.
- Dialogs.
- Responsive layouts.

### Infrastructure

- Production Supabase project.
- Production Vercel environment.
- Domain configuration.
- OAuth callback configuration.
- Email domain authentication.
- Backup strategy.
- Storage backup strategy.
- Error monitoring.
- Recovery documentation.

### Deliverables

- Production build.
- Tested deployment.
- Production configuration.
- Security review.
- Launch checklist.
- Operational documentation.

### Acceptance Criteria

- No unresolved critical security issues.
- No major broken user journeys.
- Production environment is isolated from development.
- Database migrations are applied and verified.
- Backup and recovery plans exist.
- Real authentication providers work.
- Core functionality works on mobile and desktop.
- Monitoring and error reporting are configured.

**Approval gate:** Explicit product-owner approval before public launch.

---

# 13. Development Prioritization

The following order is mandatory unless the product owner approves a change.

| Priority | Milestone | Importance |
|---|---|---|
| 0 | Project Foundation | Critical |
| 1 | UI Foundation | Critical |
| 2 | Database and Authentication | Critical |
| 3 | Social Experience | High |
| 4 | Media System | High |
| 5 | Impact Verification | Critical |
| 6 | XP and Badges | High |
| 7 | Communities and Challenges | High |
| 8 | Communication | Medium |
| 9 | Administration | Critical |
| 10 | Production Readiness | Critical |

Security requirements must be implemented from the beginning, not postponed until Milestone 10.

---

# 14. Quality Assurance Strategy

Every milestone must include testing.

## Unit Tests

Use Vitest for:
- Utility functions.
- Validation.
- Business logic.
- XP calculations.
- Level calculations.
- Permission helpers.

## Integration Tests

Test:
- Supabase operations.
- RLS.
- Storage access.
- Verification transactions.
- Database constraints.
- Authentication behavior.

## End-to-End Tests

Use Playwright for:
- Complete user journeys.
- Responsive navigation.
- Authentication.
- Post creation.
- Media uploads.
- Environmental submissions.
- Verification.
- XP awards.
- Messaging.
- Administration.

## Visual Testing

Compare implemented screens against the official reference image.

Test desktop and mobile independently.

Do not assume a desktop layout is correct simply because it fits inside a mobile viewport.

---

# 15. Agent Collaboration Strategy

If multiple Antigravity agents are available, assign responsibilities carefully.

## Lead Architect

Responsible for:
- Architecture.
- Integration.
- Code review.
- Technical decisions.
- Milestone coordination.

## Frontend Agent

Responsible for:
- Components.
- Screens.
- Responsive layouts.
- Design system.
- Accessibility.

## Backend Agent

Responsible for:
- Database migrations.
- Supabase.
- RLS.
- Authentication.
- Server-side services.
- Business logic.

## QA Agent

Responsible for:
- Unit tests.
- Integration tests.
- End-to-end tests.
- Visual testing.
- Regression testing.

### Collaboration Rules

- One agent owns each task.
- Agents must communicate schema changes.
- Avoid simultaneous editing of the same files.
- Shared design tokens must have one owner.
- All work must be reviewed before integration.
- The lead architect resolves conflicts.

Do not create unnecessary agents for simple tasks.

---

# 16. Project Tracking

Maintain a development progress document.

Recommended file:

`docs/DEVELOPMENT_STATUS.md`

Track:

- Current milestone.
- Current task.
- Completed tasks.
- In-progress tasks.
- Blocked tasks.
- Known bugs.
- Security concerns.
- Pending approvals.
- Test results.

Use GitHub Issues or an equivalent tracker for task management.

Every task should have:
- Clear scope.
- Acceptance criteria.
- Assigned owner.
- Dependencies.
- Completion status.

---

# 17. Change Management

The product owner must approve significant changes to:

- Core product philosophy.
- Database architecture.
- Authentication.
- Security policies.
- Environmental verification rules.
- XP calculations.
- Privacy rules.
- Main navigation.
- Design identity.
- Major infrastructure choices.

Antigravity may suggest improvements but must not silently change approved specifications.

Record significant architecture decisions in:

`docs/DECISIONS.md`

---

# 18. Final Development Standard

EcoShare is not a disposable prototype.

The goal is a maintainable, secure and production-ready platform.

The application should evolve through tested increments.

Never sacrifice security for speed.

Never sacrifice usability for unnecessary complexity.

Never sacrifice product identity for generic AI-generated UI.

**Build carefully. Test continuously. Ship deliberately.**

**EcoShare — Share Actions. Inspire Change.**
