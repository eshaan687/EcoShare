import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your EcoShare account.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center lg:text-left">
        <h2 className="text-xl font-bold text-foreground">Welcome back to EcoShare</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to share environmental actions and track your verified impact.
        </p>
      </div>

      <Suspense
        fallback={<Skeleton className="h-[460px] w-full rounded-[20px]" />}
      >
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
          fallbackRedirectUrl="/home"
        />
      </Suspense>
    </div>
  );
}
