import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "rounded-pill bg-primary text-surface hover:bg-primary-dark shadow-2xs",
        secondary:
          "rounded-pill border border-border bg-surface text-text-primary hover:bg-background",
        outlineLight:
          "rounded-pill border border-surface/80 bg-surface/10 text-surface backdrop-blur-xs hover:bg-surface/20",
        danger:
          "rounded-button border border-error/30 bg-error/10 text-error hover:bg-error/20",
        ghost:
          "rounded-button text-text-secondary hover:bg-background hover:text-text-primary",
        icon: "rounded-pill text-text-secondary hover:bg-background hover:text-text-primary",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size }),
          pill ? "rounded-pill" : undefined,
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
