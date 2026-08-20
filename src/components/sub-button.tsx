"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { patchUserPreview } from "@/lib/user-preview-cache";
import { cn } from "@/lib/utils";

export function SubButton({
  targetUserId,
  initialSubscribed,
  className,
  size = "sm",
  onToggle,
}: {
  targetUserId: string;
  initialSubscribed: boolean;
  className?: string;
  size?: "sm" | "default";
  onToggle?: (subscribed: boolean, subscriberCount: number) => void;
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const previous = subscribed;
    setSubscribed(!previous);

    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(targetUserId)}/subscribe`,
        { method: "POST" },
      );
      if (res.status === 401) {
        setSubscribed(previous);
        toast.error("Faça login para dar sub.");
        return;
      }
      if (!res.ok) {
        setSubscribed(previous);
        toast.error("Não foi possível atualizar o sub.");
        return;
      }
      const data = (await res.json()) as {
        subscribed: boolean;
        subscriberCount: number;
      };
      setSubscribed(data.subscribed);
      patchUserPreview(targetUserId, {
        subscribedByMe: data.subscribed,
        subscriberCount: data.subscriberCount,
      });
      onToggle?.(data.subscribed, data.subscriberCount);
    } catch {
      setSubscribed(previous);
      toast.error("Não foi possível atualizar o sub.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={subscribed ? "outline" : "default"}
      size={size}
      className={cn(size === "sm" && "h-8 px-2 text-xs", className)}
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={subscribed}
    >
      {subscribed ? "Subscrito" : "Sub"}
    </Button>
  );
}
