import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your EcoShare account and start sharing verified environmental actions.",
};

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center lg:text-left">
        <h2 className="text-xl font-bold text-foreground">Join EcoShare</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your account to participate in challenges and earn verified environmental XP.
        </p>
      </div>

      <Suspense
        fallback={<Skeleton className="h-[500px] w-full rounded-[20px]" />}
      >
        <SignUp
          path="/signup"
          routing="path"
          signInUrl="/login"
          fallbackRedirectUrl="/home"
        />
      </Suspense>
    </div>
  );
}
