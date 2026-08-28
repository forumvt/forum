"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BBCodeEditor } from "@/components/bbcode-editor";
import { PmPeoplePicker } from "@/components/pm-people-picker";
import { Button } from "@/components/ui/button";
import { PM_MAX_LENGTH, type PmPerson } from "@/types/pm";

export function PmComposeForm({
  initialRecipients = [],
  conversationId,
}: {
  initialRecipients?: PmPerson[];
  conversationId?: string;
}) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [recipients, setRecipients] = useState<PmPerson[]>(initialRecipients);
  const overLimit = content.length > PM_MAX_LENGTH;
  const isNew = !conversationId;
  const recipientIds = recipients.map((person) => person.id);

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || overLimit || saving) return;
    if (isNew && recipientIds.length === 0) {
      toast.error("Escolha pelo menos uma pessoa.");
      return;
    }
    setSaving(true);
    try {
      const res = conversationId
        ? await fetch(`/api/pm/${encodeURIComponent(conversationId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmed }),
          })
        : await fetch("/api/pm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientUserIds: recipientIds,
              content: trimmed,
            }),
          });
      const data = (await res.json().catch(() => null)) as {
        conversationId?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        toast.error(data?.error || "Não foi possível enviar a mensagem.");
        return;
      }
      if (data?.conversationId) {
        window.location.href = `/mensagens/${encodeURIComponent(data.conversationId)}`;
        return;
      }
      window.location.reload();
    } catch {
      toast.error("Não foi possível enviar a mensagem.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {isNew ? (
        <PmPeoplePicker selected={recipients} onChange={setRecipients} />
      ) : null}
      <BBCodeEditor
        id={conversationId ? `pm-reply-${conversationId}` : "pm-new"}
        value={content}
        onChange={setContent}
        disabled={saving}
        placeholder="Escreva uma mensagem privada. Use BBCode para formatar."
        minHeightClass="min-h-[140px]"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          className={
            overLimit
              ? "text-destructive text-sm"
              : "text-muted-foreground text-sm"
          }
        >
          {content.length}/{PM_MAX_LENGTH}
        </p>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={
            saving ||
            overLimit ||
            !content.trim() ||
            (isNew && recipientIds.length === 0)
          }
          aria-busy={saving}
        >
          {saving ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
