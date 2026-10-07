"use client";

import { SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MusicRoomUser } from "@/types/music";

export function RoomControls({
  currentUserId,
  currentDj,
  users,
  loading,
  onSkip,
}: {
  currentUserId: string | null;
  currentDj: MusicRoomUser | null;
  users: MusicRoomUser[];
  loading?: boolean;
  onSkip: () => void;
}) {
  const me = users.find((u) => u.id === currentUserId);
  const canSkip =
    Boolean(currentUserId) &&
    (currentDj?.id === currentUserId || me?.isModerator);

  if (!canSkip) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading || !currentDj}
        onClick={onSkip}
      >
        <SkipForward className="size-4" />
        Pular faixa
      </Button>
    </div>
  );
}
