"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userProfilePath } from "@/lib/app-url";
import { canBanUser, roleLabel, type UserRole } from "@/lib/permissions";
import type { AdminUserItem } from "@/types/moderation";

export function ModerationUsersTable({
  users,
  canAssignRole,
  actorRole,
}: {
  users: AdminUserItem[];
  canAssignRole: boolean;
  actorRole?: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function patch(userId: string, body: Record<string, unknown>) {
    setPendingId(userId);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        toast.error("Não foi possível atualizar.");
        return;
      }
      toast.success("Atualizado.");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
    } finally {
      setPendingId(null);
    }
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum usuário.</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id} className="chaos-card border-border bg-card border">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <a
                href={userProfilePath(user.id)}
                className="text-foreground font-semibold hover:underline"
              >
                {user.name}
              </a>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
              {user.bannedAt ? (
                <p className="text-destructive mt-1 text-xs">
                  Suspenso
                  {user.banReason ? `: ${user.banReason}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canAssignRole ? (
                <Select
                  value={user.role}
                  disabled={pendingId === user.id}
                  onValueChange={(value) =>
                    void patch(user.id, { role: value as UserRole })
                  }
                >
                  <SelectTrigger size="sm" className="w-[11rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Membro</SelectItem>
                    <SelectItem value="MODERATOR">Moderador</SelectItem>
                    <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{roleLabel(user.role)}</span>
              )}
              {canBanUser(actorRole, user.role) ? (
                <Button
                  type="button"
                  size="sm"
                  variant={user.bannedAt ? "outline" : "destructive"}
                  disabled={pendingId === user.id}
                  onClick={() =>
                    void patch(user.id, { banned: !user.bannedAt })
                  }
                >
                  {user.bannedAt ? "Reativar" : "Suspender"}
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
