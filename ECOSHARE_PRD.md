# EcoShare — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Approved Product Direction  
**Product:** EcoShare  
**Platform:** Responsive Web Application  
**Audience:** Worldwide  
**Backend:** Supabase  
**Frontend:** Next.js + TypeScript

---

# 1. Product Overview

## 1.1 What is EcoShare?

EcoShare is a worldwide environmental social network designed to connect people who care about the planet and encourage meaningful environmental action.

It combines the social experience of a modern community platform with a structured environmental contribution and verification system.

Users can:
- Share environmental content, photographs and videos.
- Discover environmental initiatives happening worldwide.
- Follow people and organizations.
- Join environmental communities.
- Participate in environmental challenges.
- Submit evidence of real-world environmental contributions.
- Earn experience points, badges and reputation for verified contributions.
- Track their environmental participation over time.

EcoShare aims to transform environmental awareness into measurable participation.

## 1.2 Mission

To connect people worldwide and make environmental action visible, accessible, rewarding and collaborative.

## 1.3 Vision

A world where anyone can contribute to protecting the planet, connect with others doing the same, and build a trusted record of their environmental contributions.

## 1.4 Core Philosophy

EcoShare follows five principles:

1. **Action over attention:** Environmental contributions matter more than likes and followers.
2. **Trust over vanity:** Verified contributions must be distinguishable from ordinary social content.
3. **Community over competition:** Gamification should encourage participation, not unhealthy competition.
4. **Transparency:** Users should understand how environmental contributions are reviewed and rewarded.
5. **Privacy by design:** Personal information and private verification evidence must be protected.

---

# 2. Target Audience

EcoShare is designed for a worldwide audience.

Primary user groups:

- Individuals interested in environmental protection.
- Students and educational institutions.
- Environmental volunteers.
- NGOs and nonprofit organizations.
- Environmental clubs and communities.
- Sustainability-focused businesses.
- Local environmental organizations.
- People organizing cleanups, tree-planting events and conservation initiatives.

The platform must be accessible to beginners. Users should not need scientific knowledge or previous environmental experience to participate.

---

# 3. Account Types and Permissions

## 3.1 Standard User

A standard user can:
- Create an account.
- Customize a profile.
- Publish posts.
- Upload photographs and videos.
- Follow and unfollow other users.
- Like and comment on posts.
- Bookmark content.
- Join communities.
- Participate in challenges.
- Submit environmental contributions.
- View verification history.
- Earn XP and badges.
- Receive notifications.
- Send and receive messages, subject to platform policies.
- Report inappropriate content.

## 3.2 Moderator

Moderators can:
- Review reported posts and comments.
- Manage community safety.
- Hide or remove content within assigned permissions.
- Escalate serious issues.
- Review relevant moderation history.

Moderators must not automatically receive permission to approve environmental impact submissions.

## 3.3 Environmental Verifier

Authorized environmental verifiers can:
- Access assigned impact submissions.
- Review submitted evidence.
- Approve legitimate contributions.
- Reject invalid submissions with a reason.
- Request additional information.
- Record verification decisions.

## 3.4 Administrator

Administrators can:
- Manage users and roles.
- Manage communities.
- Manage challenges.
- Review environmental submissions.
- Assign verifier permissions.
- Manage platform configuration.
- Review reports.
- Access administrative analytics.
- View audit logs.

Administrative permissions must be enforced on the server and database, not merely hidden in the frontend.

---

# 4. Authentication and Onboarding

## 4.1 Authentication Methods

Support three authentication methods:

- Email and password.
- Google authentication.
- Apple authentication.

Use Supabase Auth.

## 4.2 Registration

Registration must collect:

- Email address.
- Password when using email authentication.
- Username.
- Display name.
- Acceptance of Terms of Service.
- Acceptance of Privacy Policy.

Additional profile information can be completed later.

## 4.3 Onboarding Experience

After registration, introduce users to EcoShare through a short onboarding experience.

Users should be able to:

1. Select environmental interests.
2. Add a profile photograph.
3. Write a short biography.
4. Select their country or region.
5. Discover suggested communities.
6. Follow suggested accounts.
7. Learn how environmental contribution verification works.

Do not force users to complete every optional profile field.

## 4.4 Account Security

Implement:
- Email verification.
- Password recovery.
- Secure session management.
- Logout from current session.
- Account security settings.
- Appropriate authentication error handling.

Never trust user-supplied role information.

---

# 5. User Profiles

Each profile should include:

- Profile photograph.
- Cover photograph.
- Username.
- Display name.
- Biography.
- Country or region, if shared.
- Join date.
- Followers count.
- Following count.
- Environmental XP.
- Current level.
- Earned badges.
- Approved environmental contributions.
- Published posts.
- Joined communities.

Users can edit their profile and control appropriate privacy settings.

Environmental reputation must be calculated using verified contributions, not followers, likes or post engagement.

---

# 6. Social Feed

The social feed is one of EcoShare's central experiences.

## 6.1 Feed Content

Users can publish:
- Text posts.
- Photographs.
- Videos.
- Multiple photographs in one post.
- Environmental updates.
- Questions and discussions.
- Educational content.
- Event announcements.

## 6.2 Feed Interactions

Users can:
- Like posts.
- Comment on posts.
- Reply to comments.
- Bookmark posts.
- Share posts.
- Follow authors.
- Report inappropriate content.

## 6.3 Feed Organization

Provide:

**Following Feed:** Content from accounts the user follows.

**Discover Feed:** Public content from across EcoShare.

**Recommended Content:** Relevant content based on interests and platform activity.

Use a transparent, configurable recommendation system. Do not present fabricated engagement or recommendation data.

## 6.4 Important Separation

A normal social post is NOT an environmental verification submission.

A user can publish a photograph of a cleanup without receiving verified environmental XP.

To receive verified contribution credit, the user must separately submit the contribution through the Impact Submission workflow.

---

# 7. Environmental Impact System

This is EcoShare's defining feature.

## 7.1 Impact Submissions

Users can submit evidence of real-world environmental contributions.

Examples include:

- Community cleanups.
- Tree planting.
- Recycling initiatives.
- Beach cleanups.
- Environmental education.
- Wildlife conservation activities.
- Habitat restoration.
- Sustainable community projects.
- Water conservation activities.
- Other approved environmental initiatives.

## 7.2 Submission Information

Each submission should contain:

- Activity title.
- Activity description.
- Contribution category.
- Date of activity.
- Country or region.
- Optional location information.
- Photographs or videos.
- Optional supporting information.
- Optional participating organization.

Users must be able to preview their submission before sending it.

## 7.3 Submission Statuses

Use the following statuses:

- Draft.
- Pending.
- Under Review.
- Approved.
- Rejected.
- Changes Requested.
- Appealed.

Every status change must be recorded.

## 7.4 Verification Process

1. User submits environmental evidence.
2. Submission enters Pending status.
3. Authorized verifier reviews the submission.
4. Verifier checks the description and evidence.
5. Verifier approves, rejects or requests additional information.
6. If approved, the system awards the configured XP.
7. The user's environmental reputation updates.
8. User receives a notification.

## 7.5 Verification Transparency

Users must be able to see:
- Current submission status.
- Submission date.
- Review date, when available.
- Verification outcome.
- Reason for rejection or requested changes.
- XP awarded, if approved.

Provide an appeal process.

## 7.6 Evidence Privacy

Environmental verification evidence is private by default.

Only authorized people should access private evidence.

A public impact record may display approved contribution information and approved public media, but private evidence must never become public automatically.

Users must be informed before publishing sensitive location information.

---

# 8. Gamification and Environmental Reputation

EcoShare uses gamification to encourage consistent environmental participation.

## 8.1 Experience Points

XP is awarded for eligible, approved environmental contributions.

XP must never be awarded merely for:
- Receiving likes.
- Gaining followers.
- Publishing ordinary posts.
- Creating multiple accounts.
- Repeating duplicate submissions.

XP rules must be configurable by administrators.

## 8.2 Initial Level Structure

| Level | Name | XP Required |
|---|---|---:|
| 1 | Eco Starter | 0 |
| 2 | Good Collector | 50 |
| 3 | Eco Guardian | 150 |
| 4 | Planet Protector | 350 |
| 5 | Earth Champion | 700 |
| 6 | Planet Legend | 1500 |

These are initial product values and should be configurable.

## 8.3 Badges

Create a badge system for achievements such as:

- First Verified Action.
- Cleanup Contributor.
- Tree Planter.
- Recycling Advocate.
- Community Builder.
- Challenge Finisher.
- Consistent Contributor.
- Environmental Educator.

Badges must have clear eligibility requirements.

## 8.4 Points Ledger

Every XP transaction must be recorded in a secure points ledger.

The ledger should include:
- User ID.
- XP amount.
- Transaction type.
- Related contribution.
- Timestamp.
- Administrative or system source.

Prevent duplicate XP awards through transaction-safe backend logic and database constraints.

XP is a participation and reputation indicator. It must not be falsely represented as kilograms of CO2 avoided, trees saved or another scientific measurement.

---

# 9. Environmental Communities

Users should be able to create and join communities.

Examples:
- Beach Cleanup Volunteers.
- Urban Gardening.
- Wildlife Conservation.
- Sustainable Living.
- Recycling Initiatives.
- Environmental Education.
- Local Green Communities.

Community features:

- Community name.
- Description.
- Profile image.
- Cover image.
- Public or private visibility.
- Member count.
- Community posts.
- Community discussions.
- Community challenges.
- Community moderators.
- Membership management.

Private communities require membership authorization.

---

# 10. Environmental Challenges

Challenges encourage users to take part in specific environmental activities.

Examples:

- 7-Day Plastic Reduction Challenge.
- Community Cleanup Challenge.
- Plant a Tree Initiative.
- Zero Waste Week.
- Water Conservation Challenge.

Each challenge should support:

- Title.
- Description.
- Cover image.
- Start date.
- End date.
- Eligibility requirements.
- Participation rules.
- XP rewards, if applicable.
- Participation tracking.
- Completion criteria.
- Challenge status.

Do not award completion rewards without satisfying the configured requirements.

---

# 11. Explore and Discovery

The Explore page should help users discover:

- Environmental posts.
- New users.
- Communities.
- Challenges.
- Approved contributions.
- Environmental initiatives.

Provide search and filtering.

Potential filters:
- Category.
- Country or region.
- Content type.
- Community.
- Challenge.
- Date.

Use pagination or efficient infinite scrolling.

---

# 12. Notifications

Create an in-app notification system.

Notification types include:

- New follower.
- Post like.
- New comment.
- Comment reply.
- Community invitation.
- Community activity.
- Challenge update.
- Impact submission received.
- Impact submission approved.
- Impact submission rejected.
- Additional information requested.
- Badge unlocked.
- Level achieved.
- New message.

Users should be able to mark notifications as read.

Notification preferences should be configurable.

---

# 13. Messaging

Implement private one-to-one messaging.

Requirements:

- Conversation creation.
- Conversation list.
- Message history.
- Text messages.
- Appropriate message timestamps.
- Read status where supported.
- Blocking and reporting controls.
- Authorization based on conversation membership.

Use Supabase Realtime where appropriate.

Do not expose private conversations to unauthorized users.

---

# 14. Administration Dashboard

Create a dedicated administrative interface.

## 14.1 Dashboard

Display operational metrics such as:

- Registered users.
- Active users.
- Published posts.
- Pending environmental submissions.
- Approved submissions.
- Rejected submissions.
- Active communities.
- Active challenges.

Only display real database values. Never use fabricated metrics.

## 14.2 Submission Management

Administrators and authorized verifiers must be able to:

- View pending submissions.
- Filter by category and status.
- Open submission details.
- Inspect private evidence.
- Approve contributions.
- Reject contributions with reasons.
- Request changes.
- Review appeal requests.
- View decision history.

## 14.3 User Management

Administrators should be able to:

- Search users.
- View account information.
- Suspend accounts where justified.
- Restore accounts.
- Assign authorized roles.
- Review moderation history.

All privileged actions must be logged.

---

# 15. Privacy, Safety and Community Guidelines

EcoShare must protect its users.

Implement:

- Reporting of inappropriate content.
- User blocking.
- Account privacy controls.
- Secure authentication.
- Secure media access.
- Moderation tools.
- Appropriate age-related policies.
- Data deletion request workflows.
- Privacy and Terms pages.

Do not publicly expose private contact details, precise location information or private verification evidence.

Design privacy controls with international users in mind.

---

# 16. Technical Product Requirements

## 16.1 Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui where appropriate.
- Responsive design.
- Accessible interactive components.
- Reusable component architecture.

## 16.2 Backend

Supabase will provide:

- PostgreSQL database.
- Authentication.
- Storage.
- Realtime functionality.
- Database policies.
- Server-side integrations.

## 16.3 Media

Support photographs and videos from the initial release.

Use separate storage areas for:
- Profile photographs.
- Public post media.
- Private environmental verification evidence.

Implement file validation, upload progress, error handling and appropriate access controls.

## 16.4 Performance

The application should:
- Load efficiently on desktop and mobile.
- Optimize images.
- Avoid unnecessary database queries.
- Use pagination.
- Handle network interruptions gracefully.
- Display loading, empty and error states.
- Support responsive layouts.

## 16.5 Accessibility

Target WCAG 2.2 AA where practical.

Include:
- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Accessible form labels.
- Appropriate color contrast.
- Screen-reader-friendly controls.
- Accessible dialogs and menus.

---

# 17. Initial Application Routes

## Public Routes

- `/`
- `/about`
- `/explore`
- `/communities`
- `/challenges`
- `/u/[username]`
- `/impact/[id]`
- `/guidelines`
- `/privacy`
- `/terms`
- `/login`
- `/signup`
- `/forgot-password`

## Authenticated Routes

- `/home`
- `/explore`
- `/communities`
- `/communities/[slug]`
- `/challenges`
- `/challenges/[id]`
- `/impact`
- `/create`
- `/messages`
- `/messages/[id]`
- `/notifications`
- `/bookmarks`
- `/profile`
- `/profile/edit`
- `/settings`
- `/settings/privacy`
- `/settings/security`

## Administrative Routes

- `/admin`
- `/admin/submissions`
- `/admin/submissions/[id]`
- `/admin/users`
- `/admin/reports`
- `/admin/challenges`
- `/admin/communities`
- `/admin/analytics`
- `/admin/audit-log`

All protected routes must enforce server-side authorization.

---

# 18. Initial Release Priorities

## P0 — Essential Foundation

- Project architecture.
- Responsive design system.
- Supabase integration.
- Email authentication.
- Google authentication.
- Apple authentication.
- User profiles.
- Database migrations.
- Row Level Security.
- Storage permissions.

## P1 — Core Social Experience

- Social feed.
- Posts.
- Image and video uploads.
- Likes.
- Comments.
- Following.
- Bookmarks.
- Explore.

## P2 — Environmental Contribution System

- Impact submissions.
- Private evidence storage.
- Verifier dashboard.
- Approval workflow.
- XP ledger.
- Levels and badges.
- Notifications.

## P3 — Community Experience

- Communities.
- Challenges.
- Community discussions.
- Messaging.

## P4 — Production Readiness

- Administration.
- Moderation.
- Analytics.
- Accessibility review.
- Performance optimization.
- Security testing.
- Backup and recovery procedures.
- Production deployment.

---

# 19. Product Success Metrics

Track real, meaningful product metrics:

- Monthly active users.
- Weekly active users.
- New user activation.
- Number of environmental submissions.
- Percentage of submissions reviewed.
- Number of approved contributions.
- Average verification turnaround time.
- Community participation.
- Challenge participation.
- User retention.
- Report resolution time.

Do not optimize the platform solely for time spent or engagement.

The primary success metric should be meaningful environmental participation and sustained community involvement.

---

# 20. Product Definition of Done

A feature is not complete merely because its interface looks finished.

Every feature must have:

1. Functional frontend.
2. Working backend integration.
3. Correct database behavior.
4. Appropriate authorization.
5. Input validation.
6. Loading states.
7. Empty states.
8. Error handling.
9. Responsive behavior.
10. Relevant automated tests.
11. Accessibility consideration.
12. Updated documentation.

Never use fake buttons, placeholder success messages or simulated production functionality without clearly identifying it as a prototype.

---

# 21. Final Product Direction

EcoShare must feel like a real, independent global environmental social network.

It should combine the familiarity of a modern social platform with the credibility of an environmental contribution verification system.

The product must make it easy for someone to participate in their first environmental activity while also supporting experienced contributors, organizations and communities.

The central promise is simple:

**Share what inspires you. Take action for the planet. Prove the impact. Grow together.**

**EcoShare — Connect for a Greener Tomorrow.**
