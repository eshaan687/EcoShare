import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary/50 text-primary-dark",
        verified:
          "border border-primary/30 bg-surface text-primary-dark shadow-2xs",
        warning: "bg-warning/15 text-amber-800",
        error: "bg-error/15 text-error",
        outline: "border border-border bg-surface text-text-secondary",
        neutral: "border border-border bg-background text-text-secondary",
        prototype:
          "border border-primary/35 bg-secondary/40 text-primary-dark font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
