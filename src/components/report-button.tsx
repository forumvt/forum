"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ReportTargetType } from "@/types/moderation";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending || reason.trim().length < 3) return;
    setPending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: reason.trim(),
        }),
      });
      if (res.status === 401) {
        toast.error("Faça login para denunciar.");
        return;
      }
      if (res.status === 409) {
        toast.message("Você já denunciou este conteúdo.");
        setOpen(false);
        return;
      }
      if (!res.ok) {
        toast.error("Não foi possível enviar a denúncia.");
        return;
      }
      toast.success("Denúncia enviada à moderação.");
      setReason("");
      setOpen(false);
    } catch {
      toast.error("Não foi possível enviar a denúncia.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Flag />
          Denunciar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Descreva o motivo (mínimo 3 caracteres)."
          rows={4}
        />
        <DialogFooter>
          <Button
            type="button"
            disabled={pending || reason.trim().length < 3}
            onClick={() => void submit()}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
