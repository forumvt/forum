"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { patchUserPreview } from "@/lib/user-preview-cache";
import { cn } from "@/lib/utils";

export function IgnoreButton({
  targetUserId,
  initialIgnored,
  className,
  size = "sm",
  ignoredLabel = "Ignorado",
  onToggle,
}: {
  targetUserId: string;
  initialIgnored: boolean;
  className?: string;
  size?: "sm" | "default";
  ignoredLabel?: string;
  onToggle?: (ignored: boolean) => void;
}) {
  const [ignored, setIgnored] = useState(initialIgnored);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const previous = ignored;
    setIgnored(!previous);

    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(targetUserId)}/ignore`,
        { method: "POST" },
      );
      if (res.status === 401) {
        setIgnored(previous);
        toast.error("Faça login para ignorar.");
        return;
      }
      if (!res.ok) {
        setIgnored(previous);
        toast.error("Não foi possível atualizar os ignorados.");
        return;
      }
      const data = (await res.json()) as { ignored: boolean };
      setIgnored(data.ignored);
      patchUserPreview(targetUserId, { ignoredByMe: data.ignored });
      onToggle?.(data.ignored);
      toast.success(
        data.ignored ? "Usuário ignorado." : "Usuário designorado.",
      );
    } catch {
      setIgnored(previous);
      toast.error("Não foi possível atualizar os ignorados.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={ignored ? "outline" : "secondary"}
      size={size}
      className={cn(size === "sm" && "h-8 px-2 text-xs", className)}
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={ignored}
    >
      {ignored ? ignoredLabel : "Ignorar"}
    </Button>
  );
}
