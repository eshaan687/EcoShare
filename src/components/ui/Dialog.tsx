"use client";

import { X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

export interface DialogProps {
  readonly open: boolean;
  readonly onClose?: () => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function Dialog({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const handleDismiss = useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleDismiss]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/50 p-4 backdrop-blur-2xs"
      onClick={handleDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-dialog border border-border bg-surface p-5 shadow-lg sm:p-6",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3.5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-pill text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
