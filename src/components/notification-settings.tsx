"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { NotificationPreferences } from "@/types/notification";

const OPTIONS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "ownThread",
    label: "Novas mensagens nos meus tópicos",
    description: "Quando alguém responder um tópico que você criou.",
  },
  {
    key: "viewedThread",
    label: "Novas respostas em tópicos que visualizei",
    description: "Quando um tópico que você abriu receber novas respostas.",
  },
  {
    key: "like",
    label: "Curtidas nas minhas mensagens",
    description: "Quando alguém curtir uma mensagem sua.",
  },
  {
    key: "reply",
    label: "Respostas e citações para mim",
    description: "Quando alguém responder ou citar você.",
  },
];

export function NotificationSettings({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences;
}) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);

  async function update(key: keyof NotificationPreferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("fail");
      toast.success("Preferências de alertas salvas.");
    } catch {
      setPrefs(previous);
      toast.error("Não foi possível salvar as preferências.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {OPTIONS.map((option) => (
        <div key={option.key} className="flex items-start gap-3">
          <Checkbox
            id={`alert-${option.key}`}
            checked={prefs[option.key]}
            disabled={saving}
            onCheckedChange={(checked) =>
              void update(option.key, checked === true)
            }
          />
          <div className="min-w-0">
            <Label htmlFor={`alert-${option.key}`} className="font-medium">
              {option.label}
            </Label>
            <p className="text-muted-foreground text-sm">{option.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
