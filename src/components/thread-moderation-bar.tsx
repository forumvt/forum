"use client";

import { Lock, Pin, Trash2, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ThreadForumOption } from "@/types/thread";

export function ThreadModerationBar({
  slug,
  isLocked,
  isPinned,
  isDeleted,
  forumId,
  forums,
  canDelete,
}: {
  slug: string;
  isLocked: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  forumId: string;
  forums: ThreadForumOption[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [locked, setLocked] = useState(isLocked);
  const [pinned, setPinned] = useState(isPinned);
  const [deleted, setDeleted] = useState(isDeleted);
  const [currentForumId, setCurrentForumId] = useState(forumId);

  async function run(
    action: "lock" | "unlock" | "pin" | "unpin" | "move" | "delete" | "restore",
    extra?: { forumId?: string },
  ) {
    if (pending) return;
    if (action === "delete" && !window.confirm("Excluir este tópico?")) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(
        `/api/threads/${encodeURIComponent(slug)}/moderate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        },
      );
      if (!res.ok) {
        toast.error("Não foi possível aplicar a ação.");
        return;
      }
      if (action === "lock") setLocked(true);
      if (action === "unlock") setLocked(false);
      if (action === "pin") setPinned(true);
      if (action === "unpin") setPinned(false);
      if (action === "delete") setDeleted(true);
      if (action === "restore") setDeleted(false);
      if (action === "move" && extra?.forumId) {
        setCurrentForumId(extra.forumId);
        toast.success("Tópico movido.");
        router.refresh();
        return;
      }
      toast.success("Ação aplicada.");
      router.refresh();
    } catch {
      toast.error("Não foi possível aplicar a ação.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {deleted ? (
        <p className="text-destructive text-sm font-medium">
          Tópico removido. Só a equipe vê esta página.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => void run(locked ? "unlock" : "lock")}
        >
          {locked ? <Unlock /> : <Lock />}
          {locked ? "Destrancar" : "Trancar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => void run(pinned ? "unpin" : "pin")}
        >
          <Pin />
          {pinned ? "Desafixar" : "Fixar"}
        </Button>
        {canDelete ? (
          <Button
            type="button"
            size="sm"
            variant={deleted ? "outline" : "destructive"}
            disabled={pending}
            onClick={() => void run(deleted ? "restore" : "delete")}
          >
            <Trash2 />
            {deleted ? "Restaurar" : "Excluir tópico"}
          </Button>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          Mover para
        </span>
        <Select
          value={currentForumId}
          disabled={pending}
          onValueChange={(value) => {
            if (value !== currentForumId) {
              void run("move", { forumId: value });
            }
          }}
        >
          <SelectTrigger size="sm" className="max-w-[16rem]">
            <SelectValue placeholder="Fórum" />
          </SelectTrigger>
          <SelectContent>
            {forums.map((forum) => (
              <SelectItem key={forum.id} value={forum.id}>
                {forum.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
