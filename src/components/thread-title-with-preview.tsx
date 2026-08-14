"use client";

import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { stripBBCode } from "@/utils/bbcode-parser";

const PREVIEW_MAX_LENGTH = 180;

export function ThreadTitleWithPreview({
  title,
  description,
  slug,
  isUnread,
}: {
  title: string;
  description: string;
  slug: string;
  isUnread: boolean;
}) {
  const preview =
    description.length > PREVIEW_MAX_LENGTH
      ? stripBBCode(description).slice(0, PREVIEW_MAX_LENGTH) + "…"
      : stripBBCode(description);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/threads/${slug}`}
          className="focus-visible:ring-ring block rounded-sm outline-none focus-visible:ring-[3px]"
        >
          <h3
            className={cn(
              "hover:text-primary mb-1 line-clamp-2 text-base font-bold break-words transition-colors hover:underline sm:text-lg",
              isUnread
                ? "text-foreground font-bold"
                : "text-muted-foreground font-normal",
            )}
          >
            {title}
          </h3>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
        {preview || title}
      </TooltipContent>
    </Tooltip>
  );
}
