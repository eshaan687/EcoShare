# EcoShare — Milestone 2 Remaining Work & Future Roadmap

**Project:** EcoShare — Connect for a Greener Tomorrow  
**Current State:** Milestone 2 Core Social, Communities, Challenges, Real-Time DMs, Notifications, and Impact Verification Engine Complete

---

## Prioritized Remaining Items for Future Milestones (Milestones 3–6)

### Priority 1 — External Provider Production Configuration
1. **Production OAuth Providers in Clerk Dashboard:**
   - Configure production Google Cloud OAuth and Apple Developer Sign-In credentials inside the Clerk Dashboard when moving from the `.clerk.accounts.dev` development instance to a custom production domain.
2. **Resend Transactional Email Domain Verification:**
   - Connect a verified custom DNS domain in Resend (`RESEND_API_KEY`) to send transactional email digests for impact verification approvals and weekly community summaries.

### Priority 2 — Advanced Moderation & Verifier Role Assignment UI (Milestone 5)
1. **Dedicated Admin Role Management Panel:**
   - While `public.user_roles` (`user`, `moderator`, `verifier`, `admin`) and `public.verification_audit_log` are deployed and enforced in PostgreSQL, add an admin-only UI screen to grant/revoke `verifier` and `moderator` roles without requiring SQL console queries.
2. **Content Reporting & Moderation Queue:**
   - Add a user-facing "Report Post / Comment" modal and a moderator queue for reviewing flagged community content separately from the environmental impact verification queue.

### Priority 3 — Rich Media & Map Enhancements (Milestone 6)
1. **Interactive Geographic Map View for Initiatives:**
   - Enhance the 195+ country filter on `/communities` with an optional interactive world map pin cluster view showing verified cleanups and tree-planting drives by region.
2. **Client-Side Image Compression & Multi-File Carousel Upload:**
   - Extend the Supabase Storage uploader in `CreateActionDialog` to compress high-resolution smartphone photos client-side before uploading up to 5 files per post/submission.
