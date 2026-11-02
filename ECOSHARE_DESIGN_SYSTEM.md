# EcoShare — Design System & UI Specification

**Version:** 1.0  
**Status:** Initial Visual Specification  
**Primary Reference:** Official EcoShare UI Concept Image supplied by the product owner  
**Design Philosophy:** Modern, clean, nature-inspired, social and trustworthy.

---

# 1. Design Vision

EcoShare must feel like a premium, modern environmental social network.

The interface should combine:
- The familiarity of a modern social media platform.
- The clarity of a productivity dashboard.
- The warmth of an environmental community.
- The credibility of an environmental verification platform.

The design must be visually consistent across desktop, tablet and mobile.

The supplied EcoShare reference image is the primary visual authority.

**Important implementation rule:** Do not redesign the product independently. Reproduce the visual direction, component relationships, proportions and interaction patterns of the reference. Improve usability where necessary without changing its identity.

The reference image contains multiple screens. Treat each section as a reference for its corresponding application experience, not as one literal page.

---

# 2. Brand Identity

## 2.1 Brand Name

EcoShare

## 2.2 Brand Personality

- Optimistic.
- Natural.
- Modern.
- Inclusive.
- Trustworthy.
- Community-oriented.
- Action-focused.

Avoid making the interface look overly corporate, childish, excessively gamified or like a generic AI-generated dashboard.

## 2.3 Logo Direction

Use a minimalist green leaf symbol paired with the EcoShare wordmark.

Logo requirements:
- Simple recognizable leaf silhouette.
- Green primary mark.
- Dark text wordmark.
- Clean typography.
- Good visibility at small sizes.
- Consistent proportions across desktop and mobile.

Create a reusable logo component.

Do not use emoji as the production logo.

---

# 3. Color System

Use the following reference palette as the initial design tokens.

| Token | Hex | Usage |
|---|---|---|
| Primary | #22C55E | Main actions, active states, branding |
| Primary Dark | #15803D | Hover states, strong green elements |
| Secondary | #A7F3D0 | Soft highlights and backgrounds |
| Background | #F8FAFC | Main application background |
| Surface | #FFFFFF | Cards, dialogs and panels |
| Text Primary | #0F172A | Headings and primary text |
| Text Secondary | #64748B | Metadata and supporting text |
| Border | #E2E8F0 | Dividers and card borders |
| Success | #10B981 | Approved states and success feedback |
| Warning | #F59E0B | Pending states and warnings |
| Error | #EF4444 | Rejections and destructive actions |

## 3.1 Color Usage Rules

Primary green should be used strategically.

Use it for:
- Primary buttons.
- Active navigation.
- Verified contribution indicators.
- Progress bars.
- Important calls to action.
- Selected controls.

Use white surfaces and light grey backgrounds to maintain visual breathing room.

Do not make every component green.

Use warning orange for pending review states and red for rejected or destructive states.

Text must maintain sufficient contrast against its background.

## 3.2 CSS Variable Foundation

Implement centralized design tokens.

```css
:root {
  --color-primary: #22C55E;
  --color-primary-dark: #15803D;
  --color-secondary: #A7F3D0;

  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;

  --color-text-primary: #0F172A;
  --color-text-secondary: #64748B;

  --color-border: #E2E8F0;

  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```

Use these tokens throughout the application rather than repeatedly hardcoding colors.

---

# 4. Typography

## 4.1 Primary Typeface

Use Inter.

Fallback:
- Inter.
- system-ui.
- sans-serif.

Typography should be clean, modern and highly readable.

## 4.2 Type Scale

| Element | Size | Weight |
|---|---:|---|
| H1 | 32px | 700 |
| H2 | 24px | 600 |
| H3 | 20px | 600 |
| H4 | 16px | 600 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 400 |

Use appropriate line heights:
- Headings: approximately 1.2.
- Body: approximately 1.5.
- Small text: approximately 1.4.

Avoid unnecessary font-size variation.

Typography must remain consistent across screens.

---

# 5. Spacing System

Use an 8px-based spacing system.

| Token | Value |
|---|---:|
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 20px |
| space-6 | 24px |
| space-8 | 32px |
| space-10 | 40px |
| space-12 | 48px |
| space-16 | 64px |

Rules:
- Use consistent spacing between cards.
- Keep internal card padding predictable.
- Avoid overcrowding.
- Use larger spacing to separate major sections.
- Maintain alignment across columns.

The 8px system is the primary rhythm, with 4px available for fine adjustments.

---

# 6. Shape, Borders and Elevation

## 6.1 Border Radius

Initial component radius tokens:

| Component | Radius |
|---|---:|
| Small controls | 8px |
| Buttons | 999px or 12px, depending on component |
| Standard cards | 16px |
| Large feature cards | 18–20px |
| Dialogs | 20px |
| Avatars | 50% |

Primary buttons should generally use the rounded pill appearance shown in the reference.

## 6.2 Borders

Use subtle borders.

Default border:
`1px solid #E2E8F0`

Avoid heavy outlines and excessive visual separation.

## 6.3 Shadows

Use restrained shadows for:
- Floating navigation.
- Cards.
- Dialogs.
- Dropdowns.
- Mobile overlays.

Avoid exaggerated shadows.

Cards should feel elevated slightly from the background without looking like separate floating applications.

---

# 7. Desktop Application Layout

## 7.1 Primary Dashboard Structure

The desktop dashboard should follow a three-column composition:

1. Left navigation sidebar.
2. Main content feed.
3. Right contextual information panel.

The top navigation bar spans the main application area.

Reference target: a desktop viewport around 1440px wide.

## 7.2 Sidebar

The sidebar contains:

- EcoShare logo.
- Home.
- Explore.
- Communities.
- Challenges.
- My Impact.
- Messages.
- Notifications.
- Bookmarks.
- Settings.

Navigation requirements:
- Fixed or sticky positioning on desktop.
- Consistent icon alignment.
- Clear active navigation state.
- Green-tinted active background.
- Rounded active navigation item.
- Text labels alongside icons.
- Notification count badge.
- Responsive collapse behavior.

The sidebar must not overwhelm the main feed.

## 7.3 Top Navigation

The top bar includes:

- Search input.
- Create button.
- Notifications icon.
- User avatar.
- Account dropdown.

Use a white or softly translucent surface.

Maintain consistent alignment and height.

Search must eventually connect to real application search functionality.

## 7.4 Main Content Area

The central dashboard should contain:

1. Welcome or promotional hero.
2. Feed navigation tabs.
3. Social feed.
4. Content creation entry point.

The hero section should communicate the product's central message:

**Share Actions. Inspire Change.**

Supporting copy:

A global community for a cleaner, healthier planet.

Primary action:
Share Your Action.

Secondary action:
Explore Challenges.

Use a nature photograph with a darkened overlay for readable white text.

Do not hardcode an image URL or use random stock photographs as permanent production assets. Use curated assets selected for EcoShare.

## 7.5 Right Information Panel

The right panel contains contextual information:

- User summary.
- Environmental level.
- XP progress.
- Points.
- Verified actions.
- Badges.
- Ongoing challenges.

Cards should be compact and visually balanced.

The right panel should not become a second main feed.

On smaller screens, move these elements into relevant pages or collapsible sections.

---

# 8. Social Feed Design

## 8.1 Feed Tabs

The initial desktop feed should provide:

- For You.
- Following.
- Verified Impact.

The selected tab should have:
- Green text or icon.
- Green bottom indicator.
- Clear keyboard focus state.

## 8.2 Post Card

Each post card should contain:

- User avatar.
- Display name.
- Verified badge, when applicable.
- Username or location metadata.
- Relative publication time.
- Post options menu.
- Post text.
- Media gallery.
- Interaction controls.

## 8.3 Interaction Row

Support:

- Like.
- Comment.
- Share.
- Bookmark.
- Additional options.

Use consistent icon sizes.

Do not use excessive decorative elements.

## 8.4 Verified Impact Indicator

Verified posts and approved impact content may display a clear verification indicator.

The indicator must distinguish:
- Verified environmental contribution.
- Ordinary user-generated content.
- Platform identity verification, if introduced later.

Do not give users a verified environmental badge simply because their account has a photograph or many followers.

---

# 9. Hero and Promotional Cards

The dashboard hero should be visually prominent.

Design requirements:
- Wide landscape image.
- Rounded corners.
- Dark gradient overlay.
- Large white heading.
- Supporting text.
- Primary and secondary CTA buttons.
- Responsive content placement.

The design should adapt to smaller screens without making text unreadable.

Challenge cards should include:
- Thumbnail image.
- Challenge title.
- Short description.
- Participant count.
- Navigation indicator.

---

# 10. Impact Submission Interface

The reference includes a dedicated environmental action submission panel.

Build a clear, focused submission experience.

## 10.1 Submission Form

Include:
- Submission title.
- Contribution category.
- Description.
- Media upload.
- Optional location.
- Submission button.

## 10.2 Media Upload

The upload area should support:
- Drag and drop on desktop.
- File selection.
- Photo uploads.
- Video uploads.
- Upload progress.
- Upload error states.
- Retry.
- Remove attachment.

Display applicable file limits and supported formats.

## 10.3 Submission Actions

Provide:
- Cancel.
- Submit for Verification.

The submission button should be disabled when required fields are missing or an upload is still being processed.

## 10.4 User Feedback

After successful submission, show the actual submission status.

Never display an approval message until the server confirms approval.

---

# 11. Administrative Verification Interface

The administration experience should be visually consistent with EcoShare while remaining operationally focused.

## 11.1 Verification Panel

Provide:
- Pending tab.
- Approved tab.
- Rejected tab.
- Submission list.
- Submission evidence preview.
- Submission details.
- Approve action.
- Reject action.
- Request changes action.

## 11.2 Review Card

Each review card should display:
- Submitter.
- Submission time.
- Activity title.
- Location information, when available.
- Evidence thumbnail.
- Current status.

## 11.3 Verification Controls

Approve and Reject actions must be visually distinguishable.

Rejecting must require an appropriate reason.

The interface must display a confirmation or review dialog for consequential actions.

All decisions must be saved through secure server-side logic.

---

# 12. User Profile Interface

The profile page should follow the reference design.

## 12.1 Profile Header

Include:
- Cover photograph.
- Profile photograph.
- Display name.
- Username.
- Environmental level.
- Verified status where applicable.
- Edit Profile action for the owner.

## 12.2 Reputation Summary

Display:
- Points.
- Verified actions.
- Badges.

These values must come from the database.

## 12.3 Profile Navigation

Tabs:
- Posts.
- Impact.
- Badges.
- About.

Use clear active indicators.

## 12.4 Profile Content

Provide a responsive content grid or list.

Ensure private content and private submissions are not accidentally exposed.

---

# 13. Badges and Levels Interface

Create a dedicated gamification section.

## 13.1 Badge Design

Badges should use:
- Distinctive shapes.
- Green and nature-inspired colors.
- Simple visual symbols.
- Consistent outlines.
- Clear labels.

Examples:
- First Action.
- Good Collector.
- Community Helper.
- Eco Contributor.

Badges should feel like meaningful achievements, not generic decorations.

## 13.2 Level Card

Display:
- Current level.
- Level name.
- Total XP.
- Progress bar.
- XP needed for next level.

Use clear progress indicators.

All displayed progress must be calculated from real XP data.

---

# 14. Mobile Design

Mobile is a first-class product experience, not a compressed desktop layout.

The supplied reference contains two separate mobile experiences:

1. Welcome/onboarding screen.
2. Social feed screen.

Both must be implemented responsively.

## 14.1 Mobile Onboarding

Include:
- Nature background.
- EcoShare logo.
- Main message.
- Supporting description.
- Onboarding indicators where multiple slides exist.
- Get Started button.
- Log In option.

The screen should use the full available viewport height.

Ensure text remains readable over the background image.

## 14.2 Mobile Feed

The mobile feed should include:

- Compact top navigation.
- Menu icon.
- Centered logo.
- Search icon.
- Feed filter tabs.
- Social post cards.
- Media.
- Interaction controls.

## 14.3 Bottom Navigation

Provide a mobile bottom navigation bar.

Initial items:
- Home.
- Explore.
- Create.
- Communities.
- Profile.

The Create action should be visually emphasized.

The bottom navigation should respect device safe areas.

## 14.4 Responsive Behavior

Desktop:
- Persistent sidebar.
- Main feed.
- Contextual right panel.

Tablet:
- Collapsed or reduced sidebar.
- Main feed receives more width.
- Contextual panel becomes optional.

Mobile:
- No persistent desktop sidebar.
- Compact header.
- Single-column content.
- Bottom navigation.
- Full-width cards.

Avoid horizontal overflow.

---

# 15. Buttons and Interaction Components

Create reusable components.

## 15.1 Primary Button

Appearance:
- Primary green.
- White text.
- Rounded pill or reference-consistent radius.
- Clear hover state.
- Clear focus state.
- Disabled state.
- Loading state.

## 15.2 Secondary Button

Appearance:
- White or transparent background.
- Subtle border.
- Dark text.
- Rounded shape.
- Clear hover and focus states.

## 15.3 Icon Button

Used for:
- Search.
- Notifications.
- More options.
- Create.
- Bookmark.
- Navigation.

Every icon button must have an accessible label.

## 15.4 Verified Badge

Use a consistent green verification indicator.

## 15.5 Badge and Level Components

Build reusable components for environmental achievements and user levels.

---

# 16. Iconography

Use a consistent icon library.

Recommended: Lucide React.

Icon requirements:
- Consistent stroke weight.
- Consistent sizing.
- Simple recognizable symbols.
- No mixing of unrelated icon styles.
- Appropriate accessible labels.

Suggested sizes:
- Small: 16px.
- Standard: 20px.
- Large: 24px.
- Feature: 28–32px.

Avoid using emoji as replacements for interface icons.

---

# 17. Image and Media Direction

Photography is important to EcoShare's identity.

Use authentic environmental imagery:
- Forests.
- Mountains.
- Oceans.
- Wildlife.
- Recycling.
- Community cleanups.
- Tree planting.
- Environmental volunteers.

Image requirements:
- High quality.
- Natural lighting where appropriate.
- Realistic appearance.
- Consistent cropping.
- Responsive behavior.
- Appropriate compression.

Do not repeatedly reuse the same image across unrelated cards.

Use local curated assets or properly licensed media.

User-uploaded content must retain its actual content and aspect ratio wherever practical.

---

# 18. Responsive Breakpoints

Use the following initial breakpoints:

| Device | Width |
|---|---:|
| Small mobile | 360px |
| Standard mobile | 390px |
| Large mobile | 430px |
| Tablet | 768px |
| Small desktop | 1024px |
| Desktop | 1280px |
| Large desktop | 1440px |

These are initial testing targets, not restrictions on fluid layouts.

The layout must adapt naturally between breakpoints.

---

# 19. Grid System

Desktop reference:
- 12-column grid.
- Maximum content width approximately 1200px.
- Consistent column gaps.
- Responsive side panels.

The main dashboard should use a flexible grid rather than fixed absolute positioning.

Cards should resize naturally.

Do not recreate the reference image as one flattened background or screenshot.

Every visible interface element must be implemented as a real component.

---

# 20. Loading, Empty, Error and Success States

Every major feature must include:

**Loading**
- Skeleton cards.
- Upload progress.
- Loading indicators.

**Empty**
- No posts.
- No notifications.
- No messages.
- No communities.
- No submissions.

**Error**
- Network failure.
- Upload failure.
- Authentication failure.
- Permission denied.
- Validation errors.

**Success**
- Post published.
- Submission received.
- Profile updated.
- Challenge joined.
- Settings saved.

Use clear, human-friendly messages.

---

# 21. Accessibility

Target WCAG 2.2 AA.

Requirements:
- Semantic HTML.
- Keyboard navigation.
- Visible focus indicators.
- Sufficient color contrast.
- Accessible form controls.
- Accessible dialogs.
- Screen-reader labels.
- Reduced-motion support.
- Appropriate alternative text.

Do not communicate status through color alone.

---

# 22. Motion and Animation

Animations should be subtle.

Use transitions for:
- Button hover.
- Navigation changes.
- Dropdowns.
- Dialogs.
- Tab changes.
- Progress indicators.

Avoid:
- Excessive bouncing.
- Constant animations.
- Distracting backgrounds.
- Unnecessary page transitions.

Respect reduced-motion preferences.

---

# 23. Component Architecture

Create reusable components.

Suggested structure:

```text
components/
  branding/
    EcoShareLogo.tsx

  layout/
    AppShell.tsx
    DesktopSidebar.tsx
    TopNavigation.tsx
    MobileHeader.tsx
    MobileBottomNavigation.tsx

  feed/
    FeedTabs.tsx
    PostCard.tsx
    PostMedia.tsx
    PostActions.tsx
    CreatePost.tsx

  impact/
    ImpactSubmissionForm.tsx
    ImpactCard.tsx
    VerificationBadge.tsx
    ImpactStatus.tsx

  profile/
    ProfileHeader.tsx
    ProfileStats.tsx
    ProfileTabs.tsx

  gamification/
    XPProgress.tsx
    LevelCard.tsx
    BadgeCard.tsx

  challenges/
    ChallengeCard.tsx

  communities/
    CommunityCard.tsx

  admin/
    VerificationQueue.tsx
    VerificationReview.tsx

  ui/
    Button.tsx
    Avatar.tsx
    Card.tsx
    Dialog.tsx
    Input.tsx
    Skeleton.tsx
```

Adapt this structure to the actual application architecture.

Do not create duplicate components for the same purpose.

---

# 24. Design Implementation Rules for Antigravity

These rules are mandatory.

1. Treat the supplied EcoShare reference image as the primary visual reference.
2. Do not generate an unrelated social network design.
3. Do not use generic dashboard templates without adapting them to EcoShare.
4. Build real responsive components.
5. Do not use a screenshot as the actual application interface.
6. Do not hardcode fake user statistics into production features.
7. Keep design tokens centralized.
8. Reuse shared components.
9. Maintain consistent typography.
10. Maintain consistent spacing.
11. Maintain consistent iconography.
12. Implement loading, empty, error and success states.
13. Test desktop, tablet and mobile layouts.
14. Check keyboard accessibility.
15. Avoid unnecessary visual complexity.
16. Do not change the brand identity without approval.

## Visual Quality Review

After implementing each screen:

- Compare it against the supplied reference.
- Check layout proportions.
- Check spacing.
- Check font sizes.
- Check colors.
- Check card dimensions.
- Check image cropping.
- Check alignment.
- Check mobile behavior.

Do not claim pixel-perfect accuracy without performing an actual visual comparison.

---

# 25. Official Visual Direction

The defining EcoShare visual identity is:

**Nature-inspired photography + clean white surfaces + fresh green accents + rounded cards + clear typography + trustworthy verification indicators.**

The design should feel welcoming enough for a new user and professional enough for environmental organizations.

The most important experience is making environmental participation feel simple, meaningful and rewarding.

**EcoShare — Share Actions. Inspire Change.**
