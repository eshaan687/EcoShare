import Image from "next/image";

import { VerificationBadge } from "@/components/impact/VerificationBadge";
import type { PrototypePostMedia } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface PostMediaProps {
  readonly media: readonly PrototypePostMedia[];
  readonly className?: string;
}

/**
 * Renders 1-photo or 2-photo side-by-side post media grid matching Sofia M.'s post
 * in references/ecoshare-ui-reference.png, including the "Verified Impact" overlay pill.
 */
export function PostMedia({ media, className }: PostMediaProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid gap-2.5",
        media.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        className,
      )}
    >
      {media.map((item) => (
        <div
          key={item.id}
          className="relative h-52 w-full overflow-hidden rounded-xl border border-border bg-background sm:h-56"
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 640px) 100vw, 340px"
            className="object-cover"
          />
          {item.hasVerifiedImpactBadge ? (
            <div className="absolute right-2.5 top-2.5">
              <VerificationBadge status="verified" overlay />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
