"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BBCodeEditor } from "@/components/bbcode-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  SIGNATURE_MAX_LENGTH,
  type SignatureSettings,
} from "@/types/user";

export function SignatureSettingsForm({
  initialSettings,
}: {
  initialSettings: SignatureSettings;
}) {
  const [signature, setSignature] = useState(initialSettings.signature);
  const [showSignatures, setShowSignatures] = useState(
    initialSettings.showSignatures,
  );
  const [savingSignature, setSavingSignature] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const overLimit = signature.length > SIGNATURE_MAX_LENGTH;

  async function updateShowSignatures(value: boolean) {
    const previous = showSignatures;
    setShowSignatures(value);
    setSavingPref(true);
    try {
      const res = await fetch("/api/user/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showSignatures: value }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success("Preferência de assinaturas salva.");
    } catch {
      setShowSignatures(previous);
      toast.error("Não foi possível salvar a preferência.");
    } finally {
      setSavingPref(false);
    }
  }

  async function saveSignature() {
    if (overLimit) {
      toast.error(`A assinatura pode ter no máximo ${SIGNATURE_MAX_LENGTH} caracteres.`);
      return;
    }
    setSavingSignature(true);
    try {
      const res = await fetch("/api/user/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { settings?: SignatureSettings };
      if (data.settings) {
        setSignature(data.settings.signature);
      }
      toast.success("Assinatura salva.");
    } catch {
      toast.error("Não foi possível salvar a assinatura.");
    } finally {
      setSavingSignature(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Checkbox
          id="show-signatures"
          checked={showSignatures}
          disabled={savingPref}
          onCheckedChange={(checked) =>
            void updateShowSignatures(checked === true)
          }
        />
        <div className="min-w-0">
          <Label htmlFor="show-signatures" className="font-medium">
            Mostrar assinaturas de outros usuários
          </Label>
          <p className="text-muted-foreground text-sm">
            Quando desativado, as assinaturas não aparecem nos tópicos.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="user-signature" className="font-medium">
          Sua assinatura
        </Label>
        <BBCodeEditor
          id="user-signature"
          value={signature}
          onChange={setSignature}
          disabled={savingSignature}
          placeholder="Texto que aparece abaixo das suas mensagens no desktop."
          minHeightClass="min-h-[120px]"
          compact
        />
        <div className="flex items-center justify-between gap-3">
          <p
            className={
              overLimit
                ? "text-destructive text-sm"
                : "text-muted-foreground text-sm"
            }
          >
            {signature.length}/{SIGNATURE_MAX_LENGTH}
          </p>
          <Button
            type="button"
            onClick={() => void saveSignature()}
            disabled={savingSignature || overLimit}
            aria-busy={savingSignature}
          >
            {savingSignature ? "Salvando..." : "Salvar assinatura"}
          </Button>
        </div>
      </div>
    </div>
  );
}
