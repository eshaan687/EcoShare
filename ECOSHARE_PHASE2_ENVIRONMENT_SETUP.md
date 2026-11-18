# EcoShare — Phase 2 Environment Setup & Configuration Guide

**Project:** EcoShare  
**Document Version:** 2.0  
**Status:** Approved Setup Guide  
**Date:** November 2026  

---

## 1. Exhaustive Environment Variables Reference

All application secrets and configurations are managed via environment variables.

> [!CAUTION]
> **Zero Credential Exposure:**
> - Never commit `.env`, `.env.local`, or any credentials to Git.
> - `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and `RESEND_API_KEY` are **server-only** secrets.
> - Never prefix server-only keys with `NEXT_PUBLIC_`.
> - Never print, log, or send credentials in client payloads.

### 1.1 Client-Side Environment Variables (`.env.local` / Vercel Client Env)

These variables are prefixed with `NEXT_PUBLIC_` and are safely embedded in client bundles.

| Variable Name | Required | Description | Example / Recommended Value |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Base canonical URL of the application | `http://localhost:3000` (local) / `https://ecoshare.org` (prod) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable public key | `pk_test_...` or `pk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Path to EcoShare branded sign-in | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Path to EcoShare branded sign-up | `/signup` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`| Yes | Redirect destination after successful login | `/home` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`| Yes | Redirect destination after registration | `/home` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API gateway URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase public publishable key (Standard) | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Legacy fallback for publishable key | `eyJhbGciOiJIUzI1NiIsInR5c...` |

> [!NOTE]
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is standardized as the official publishable key name. For backwards compatibility with standard Supabase starter conventions, `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported as a fallback when `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is not set.

### 1.2 Server-Only Environment Variables (`.env.local` / Vercel Server Env)

These variables are strictly accessible to Node.js server environments, Server Components, Server Actions, and API routes.

| Variable Name | Required | Description | Example / Source |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Yes | Clerk private backend API secret | `sk_test_...` or `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | Yes | Svix webhook signing secret from Clerk Dashboard | `whsec_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin secret key (bypasses RLS for sync) | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `RESEND_API_KEY` | Yes | Resend API secret for transactional email dispatches | `re_...` |
| `RESEND_FROM_EMAIL` | Yes | Sender address for transactional emails (Placeholder until domain verified) | `onboarding@resend.dev` (default test) or `EcoShare <notifications@ecoshare.org>` (production placeholder) |

---

## 2. Step-by-Step Infrastructure Provisioning Guide

### Step 1: Supabase Project Setup
1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Create a new project:
   - **Name:** `EcoShare Production` (or `EcoShare Dev`)
   - **Database Password:** Store securely in password manager.
   - **Region:** Choose region closest to target users (e.g. `us-east-1`).
3. Under **Project Settings -> API**:
   - Copy **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy **anon/public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`.

### Step 2: Supabase Native Third-Party Auth Integration with Clerk
Supabase natively supports Clerk as a third-party authentication provider.

1. In Supabase Dashboard, navigate to **Authentication -> Providers -> Third-Party Auth** (or **Integrations**).
2. Enable Clerk authentication provider:
   - **Clerk Domain / Issuer URL:** `https://<your-clerk-frontend-api-url>` (e.g., `https://clerk.ecoshare.org` or `https://verbose-puma-12.clerk.accounts.dev`).
   - Supabase will automatically fetch and trust Clerk's public JSON Web Key Set (`/.well-known/jwks.json`).
3. Verify JWT Claims:
   - Clerk user ID is passed in the JWT `sub` claim.
   - In Supabase PostgreSQL, this claim is directly evaluated in RLS policies as `(auth.jwt()->>'sub')`.

### Step 3: Clerk Webhook Configuration (User Profile Synchronization)
To guarantee real-time profile persistence when users sign up or update profiles in Clerk:

1. In [Clerk Dashboard](https://dashboard.clerk.com), navigate to **Configure -> Webhooks**.
2. Click **Add Endpoint**.
3. **Endpoint URL:** `https://<your-domain>/api/webhooks/clerk` (for local development, use an ngrok or local tunnel URL, e.g. `https://random-id.ngrok-free.app/api/webhooks/clerk`).
4. **Subscribe to Events:**
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Click **Create**.
6. Reveal and copy the **Signing Secret** (`whsec_...`) -> Set as `CLERK_WEBHOOK_SECRET` in `.env.local`.

### Step 4: Supabase Storage Buckets Provisioning
In Supabase Dashboard, navigate to **Storage -> Buckets** and create the following 3 buckets:

1. **`avatars`**:
   - Public Bucket: **YES** (Checked)
   - Max file size: `2MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
2. **`public-post-media`**:
   - Public Bucket: **YES** (Checked)
   - Max file size: `50MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/quicktime`
3. **`private-impact-evidence`**:
   - Public Bucket: **NO** (Unchecked — **STRICTLY PRIVATE**)
   - Max file size: `25MB`
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `application/pdf`

*Note: Storage policies are deployed via migration `003_storage_buckets.sql` to enforce user directory isolation and verifier access.*

### Step 5: Resend Transactional Email Setup
1. Log in to [Resend Dashboard](https://resend.com).
2. Navigate to **API Keys** and generate a new key with sending permissions.
3. Copy key -> Set as `RESEND_API_KEY` in `.env.local`.
4. Verify your sending domain (e.g. `ecoshare.org`) or use `onboarding@resend.dev` for testing.
5. Set `RESEND_FROM_EMAIL="EcoShare <notifications@ecoshare.org>"`.

---

## 3. Local Development Template (`.env.local.example`)

```bash
# ==========================================
# EcoShare Phase 2 Environment Configuration
# ==========================================

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clerk Public Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/signup"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/home"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/home"

# Clerk Server Secrets (SERVER-ONLY)
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Supabase Public Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Server Secret (SERVER-ONLY - NEVER EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Resend Transactional Email (SERVER-ONLY)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="EcoShare <notifications@ecoshare.org>"
```
