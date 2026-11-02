import { Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface VerificationBadgeProps {
  readonly variant?: "author" | "impactOverlay" | "inlinePill";
  readonly status?: "verified" | "pending" | "rejected";
  readonly overlay?: boolean;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Distinguishes verified environmental contributions from ordinary user content
 * per ECOSHARE_DESIGN_SYSTEM.md §8.4 and §15.4.
 */
export function VerificationBadge({
  variant,
  status = "verified",
  overlay = false,
  label,
  className,
}: VerificationBadgeProps) {
  const resolvedVariant =
    variant ?? (overlay ? "impactOverlay" : "inlinePill");

  const resolvedLabel =
    label ??
    (status === "pending"
      ? "Pending Verification"
      : status === "rejected"
        ? "Needs Revision"
        : "Verified Impact");

  if (resolvedVariant === "author") {
    return (
      <span
        title="Verified Environmental Contributor"
        aria-label="Verified Environmental Contributor"
        className={cn(
          "inline-flex items-center justify-center text-primary",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4 fill-primary text-surface" />
      </span>
    );
  }

  if (resolvedVariant === "impactOverlay") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill bg-surface/95 px-2.5 py-1 text-xs font-semibold text-text-primary shadow-sm backdrop-blur-xs",
          className,
        )}
      >
        <Check className="h-3.5 w-3.5 stroke-[2.75] text-primary-dark" />
        <span>{resolvedLabel}</span>
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-amber-800",
          className,
        )}
      >
        <Clock className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
        <span>{resolvedLabel}</span>
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill border border-error/40 bg-error/15 px-2.5 py-0.5 text-xs font-semibold text-error",
          className,
        )}
      >
        <XCircle className="h-3.5 w-3.5 text-error" aria-hidden="true" />
        <span>{resolvedLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-primary/30 bg-secondary/35 px-2.5 py-0.5 text-xs font-semibold text-primary-dark",
        className,
      )}
    >
      <Check className="h-3.5 w-3.5 stroke-[2.5] text-primary-dark" />
      <span>{resolvedLabel}</span>
    </span>
  );
}
