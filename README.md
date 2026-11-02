# EcoShare

**Share Actions. Inspire Change.**

EcoShare is a global environmental social network that combines community connection with a verified real-world environmental contribution system.

---

## Approved Technology Stack

- **Runtime:** Node.js `24.22.2` LTS (`>=24.0.0 <25.0.0`)
- **Package Manager:** `pnpm@12.16.1`
- **Framework:** Next.js `16.4.3` (App Router, `src/proxy.ts` request interception)
- **UI Library:** React `19.3.1` + TypeScript `6.0.3` (strict mode)
- **Styling & Design System:** Tailwind CSS `4.3.3` (`@tailwindcss/postcss`, `--ecoshare-*` raw tokens mapped via `@theme inline`), Lucide React `1.66.0`, `shadcn/ui` primitives
- **Authentication:** Clerk (`@clerk/nextjs@7.9.23`) supporting Email, Google, and Apple
- **Backend Platform:** Supabase (`@supabase/supabase-js@2.118.0` integrated with Clerk session tokens via the official third-party `accessToken` callback)
- **Validation:** Zod `4.6.7`
- **Testing:** Vitest `5.0.5` + Playwright `1.64.1`

---

## Local Development Setup

1. **Verify Node.js 24 LTS & pnpm:**
   ```bash
   node -v   # v24.22.2
   pnpm -v   # 12.16.1
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and populate your **Clerk** and **Supabase Development Project** credentials:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_APP_URL`: `http://localhost:3000`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk development publishable key
   - `CLERK_SECRET_KEY`: Your Clerk development secret key (server-only)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase development project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase development publishable/anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Optional for Milestone 0 dev/builds; server-only)*

4. **Start the Development Server:**
   ```bash
   pnpm dev
   ```

---

## Validation & Testing Commands

```bash
pnpm lint          # ESLint static analysis
pnpm typecheck     # TypeScript strict check (tsc --noEmit)
pnpm test:unit     # Vitest unit test suite
pnpm build         # Next.js 16 production build
pnpm test:e2e      # Playwright E2E & multi-viewport responsive tests
```

---

## Canonical Specifications

1. [`ECOSHARE_PRD.md`](./ECOSHARE_PRD.md)
2. [`ECOSHARE_DESIGN_SYSTEM.md`](./ECOSHARE_DESIGN_SYSTEM.md)
3. [`ECOSHARE_ARCHITECTURE.md`](./ECOSHARE_ARCHITECTURE.md)
4. [`ECOSHARE_IMPLEMENTATION_PLAN.md`](./ECOSHARE_IMPLEMENTATION_PLAN.md)
5. [`AGENTS.md`](./AGENTS.md)
6. Visual Reference: [`references/ecoshare-ui-reference.png`](./references/ecoshare-ui-reference.png)
