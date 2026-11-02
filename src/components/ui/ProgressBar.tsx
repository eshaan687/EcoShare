import { cn } from "@/lib/utils/cn";

export interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label = "Progress",
  className,
}: ProgressBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percentage = Math.round((clamped / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn(
        "h-2 w-full overflow-hidden rounded-pill bg-border",
        className,
      )}
    >
      <div
        className="h-full rounded-pill bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
