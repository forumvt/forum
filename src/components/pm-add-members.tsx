"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PmPeoplePicker } from "@/components/pm-people-picker";
import { Button } from "@/components/ui/button";
import type { PmPerson } from "@/types/pm";

export function PmAddMembers({
  conversationId,
  existingIds,
}: {
  conversationId: string;
  existingIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<PmPerson[]>([]);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (people.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pm/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addUserIds: people.map((person) => person.id) }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        toast.error(data?.error || "Não foi possível adicionar.");
        return;
      }
      toast.success("Pessoas adicionadas à conversa.");
      setPeople([]);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Não foi possível adicionar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {open ? (
        <div className="border-border rounded-md border p-3">
          <PmPeoplePicker
            selected={people}
            onChange={setPeople}
            excludeIds={existingIds}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPeople([]);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void add()}
              disabled={saving || people.length === 0}
            >
              {saving ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Adicionar pessoas
        </Button>
      )}
    </div>
  );
}
