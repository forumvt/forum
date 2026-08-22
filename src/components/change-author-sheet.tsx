"use client";

import { Loader2, UserPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { displayUserName, userInitials } from "@/lib/utils";
import type { AdminUserItem } from "@/types/moderation";

type SearchResponse = {
  users: AdminUserItem[];
};

export function ChangeAuthorSheet({
  currentUserId,
  currentUserName,
  saveUrl,
}: {
  currentUserId: string;
  currentUserName: string;
  saveUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<AdminUserItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ per: "10" });
    if (debouncedQuery) params.set("q", debouncedQuery);

    void fetch(`/api/admin/users?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("search_failed");
        return (await res.json()) as SearchResponse;
      })
      .then((data) => {
        setUsers(data.users ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        toast.error("Não foi possível buscar usuários.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, debouncedQuery]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setDebouncedQuery("");
      setUsers([]);
      setSelected(null);
      setSaving(false);
    }
  }

  async function confirmChange() {
    if (!selected || saving) return;
    if (selected.id === currentUserId) {
      toast.error("O autor já é este usuário.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(saveUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(data?.error || "Não foi possível alterar o autor.");
        return;
      }
      toast.success(`Autor alterado para ${displayUserName(selected.name)}.`);
      handleOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível alterar o autor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-h-10 w-full"
        >
          <UserPen />
          Alterar autor
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[min(92dvh,720px)] gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-border border-b pr-12">
          <SheetTitle>Alterar autor</SheetTitle>
          <SheetDescription>
            Autor atual: {displayUserName(currentUserName)}. Busque outro
            usuário e confirme.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nome ou e-mail"
            autoComplete="off"
            autoCorrect="off"
            className="h-12 text-base md:text-base"
          />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Buscando...
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Nenhum usuário encontrado.
              </p>
            ) : (
              <ul className="space-y-2 pb-2">
                {users.map((user) => {
                  const active = selected?.id === user.id;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(user)}
                        className={`flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-3 text-left ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:bg-muted/60"
                        }`}
                      >
                        <Avatar className="size-10">
                          {user.avatar ? (
                            <AvatarImage
                              src={user.avatar}
                              alt={displayUserName(user.name)}
                            />
                          ) : null}
                          <AvatarFallback>
                            {userInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {displayUserName(user.name)}
                          </span>
                          <span className="text-muted-foreground block truncate text-sm">
                            {user.email}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <SheetFooter className="border-border border-t sm:flex-col">
          <Button
            type="button"
            className="h-12 w-full text-base"
            disabled={!selected || selected.id === currentUserId || saving}
            onClick={() => void confirmChange()}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full text-base"
            disabled={saving}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
