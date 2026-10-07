"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MusicReactionCounts, MusicReactionKind } from "@/types/music";
import { MUSIC_REACTION_EMOJI, MUSIC_REACTION_KINDS } from "@/types/music";

export function ReactionsBar({
  reactions,
  myReaction,
  disabled,
  onReact,
}: {
  reactions: MusicReactionCounts;
  myReaction: MusicReactionKind | null;
  disabled?: boolean;
  onReact: (kind: MusicReactionKind) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUSIC_REACTION_KINDS.map((kind) => {
        const active = myReaction === kind;
        return (
          <Button
            key={kind}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={disabled || Boolean(myReaction)}
            onClick={() => onReact(kind)}
            className={cn(
              "min-w-[4.5rem] transition-transform active:scale-95",
              active && "ring-primary/40 ring-2",
            )}
          >
            <span aria-hidden>{MUSIC_REACTION_EMOJI[kind]}</span>
            <span className="tabular-nums">{reactions[kind]}</span>
          </Button>
        );
      })}
    </div>
  );
}
