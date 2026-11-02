# EcoShare — Architectural & Product Decisions Log

## ADR-001: Runtime & Framework Baseline (Node 24 LTS + Next.js 16 + Tailwind CSS 4)
- **Date:** 2026-11-01
- **Status:** Approved
- **Decision:** Standardize on Node.js `24.22.2` LTS (`>=24.0.0 <25.0.0`), `pnpm@12.16.1`, Next.js `16.4.3`, React `19.3.1`, TypeScript `6.0.3`, Tailwind CSS `4.3.3`, `@supabase/supabase-js@2.118.0`, and `@supabase/ssr@0.12.7`.
- **Rationale:** Ensures active LTS runtime support, Next.js 16 `src/proxy.ts` request interception compatibility, and zero peer-dependency conflicts with `eslint-config-next@16.4.3`.

## ADR-002: Tailwind CSS 4 Non-Self-Referencing Token Architecture
- **Date:** 2026-11-01
- **Status:** Approved
- **Decision:** Define raw EcoShare design tokens under the `--ecoshare-*` namespace in `:root` and map them to `--color-*` and `--radius-*` inside `@theme inline` in `src/app/globals.css`.
- **Rationale:** Prevents circular CSS variable references (`--color-primary: var(--color-primary)`) while preserving the exact EcoShare palette and radii specified in `ECOSHARE_DESIGN_SYSTEM.md`.

## ADR-003: Canonical URLs for `/explore`, `/communities`, and `/challenges`
- **Date:** 2026-11-01
- **Status:** Approved
- **Decision:** Maintain a single canonical route tree for `/explore`, `/communities`, and `/challenges` rather than duplicating them across `(marketing)` and `(app)` route groups. Public browsing is permitted; write/interactive operations require authentication.
- **Rationale:** Prevents Next.js App Router build-time duplicate route collisions while supporting both public discovery and authenticated participation.

## ADR-004: Authoritative XP Levels & Home Feed Tabs
- **Date:** 2026-11-01
- **Status:** Approved
- **Decision:**
  1. Home feed tabs are standardized as `For You`, `Following`, and `Verified Impact`.
  2. `ECOSHARE_PRD.md §8.2` is authoritative for XP thresholds: Level 4 is `Planet Protector` (`350 XP`) and Level 5 is `Earth Champion` (`700 XP`).

## ADR-005: Three-Layer Security Separation & Hardened XP Approval Function
- **Date:** 2026-11-01
- **Status:** Approved
- **Decision:**
  1. Separate session cookie refresh (`src/proxy.ts` using `supabase.auth.getClaims()`), server-side authorization (`src/lib/auth/guards.ts` querying `public.user_roles`), and database Row Level Security (RLS).
  2. Implement XP approval in Milestone 2/5/6 via a hardened PostgreSQL `SECURITY DEFINER` function (`public.approve_impact_submission`) with `SET search_path = pg_catalog, public`, revoked `PUBLIC`/`anon` execution, `FOR UPDATE` row locking, positive XP validation, non-self-approval enforcement, unique submission reward constraint on `points_ledger`, and append-only `audit_logs`.
