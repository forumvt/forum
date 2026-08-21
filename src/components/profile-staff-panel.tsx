"use client";

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
import { canAssignRole, canBanUser, type UserRole } from "@/lib/permissions";

export function ProfileStaffPanel({
  targetUserId,
  targetRole,
  isBanned,
  viewerRole,
  isOwnProfile,
}: {
  targetUserId: string;
  targetRole: UserRole;
  isBanned: boolean;
  viewerRole?: string;
  isOwnProfile: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [banned, setBanned] = useState(isBanned);
  const [role, setRole] = useState<UserRole>(targetRole);
  const canBan = !isOwnProfile && canBanUser(viewerRole, targetRole);
  const canRole = !isOwnProfile && canAssignRole(viewerRole);

  if (!canBan && !canRole) return null;

  async function patch(body: Record<string, unknown>, okMessage: string) {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(targetUserId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        toast.error("Não foi possível atualizar o usuário.");
        return;
      }
      toast.success(okMessage);
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o usuário.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {canBan ? (
        <Button
          type="button"
          size="sm"
          variant={banned ? "outline" : "destructive"}
          disabled={pending}
          onClick={() => {
            const next = !banned;
            const reason = next
              ? window.prompt("Motivo da suspensão (opcional):")
              : null;
            if (next && reason === null) return;
            setBanned(next);
            void patch(
              { banned: next, banReason: reason || undefined },
              next ? "Usuário suspenso." : "Suspensão removida.",
            );
          }}
        >
          {banned ? "Remover suspensão" : "Suspender"}
        </Button>
      ) : null}
      {canRole ? (
        <Select
          value={role}
          disabled={pending}
          onValueChange={(value) => {
            const next = value as UserRole;
            setRole(next);
            void patch({ role: next }, "Cargo atualizado.");
          }}
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
      ) : null}
    </div>
  );
}
