"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const IGNORED_THREAD_NOTICE =
  "Tópico foi criado por um usuário ignorado. Deseja ver?";
export const IGNORED_REPLY_NOTICE =
  "Uma resposta foi criada por um usuário ignorado. Deseja ver?";

export function IgnoredReveal({
  ignored,
  message,
  children,
}: {
  ignored?: boolean;
  message: string;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!ignored || revealed) {
    return children;
  }

  return (
    <Card className="chaos-card border-border bg-muted/40 border">
      <div className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRevealed(true)}
        >
          Ver
        </Button>
      </div>
    </Card>
  );
}
