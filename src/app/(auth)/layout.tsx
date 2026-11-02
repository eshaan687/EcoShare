import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
          <EcoShareLogo size="md" href="/" />
          <Link
            href="/home"
            className="text-xs font-semibold text-primary-dark hover:underline"
          >
            Preview Home Feed &rarr;
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 items-center gap-8 px-4 py-8 lg:grid-cols-12 sm:px-6"
      >
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between rounded-[24px] border border-border bg-surface p-6 shadow-xs">
          <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border">
            <Image
              src="/images/hero-mountains.png"
              alt="EcoShare mountain landscape"
              fill
              sizes="520px"
              className="object-cover"
            />
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
              Connect for a Greener Tomorrow
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Share Actions. Inspire Change.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in with Clerk to join environmental communities, take on global
              challenges, and submit real-world impact evidence for human verification.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-secondary bg-secondary/20 p-3 text-xs text-primary-dark">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Secured by Clerk authentication + Supabase PostgreSQL Row Level Security.
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
