"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ModerationReportItem } from "@/types/moderation";

const targetLabel = {
  post: "Resposta",
  thread: "Tópico",
  user: "Usuário",
} as const;

export function ModerationReportsTable({
  reports,
}: {
  reports: ModerationReportItem[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setStatus(id: string, status: "resolved" | "dismissed") {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar a denúncia.");
        return;
      }
      toast.success(
        status === "resolved" ? "Denúncia resolvida." : "Denúncia dispensada.",
      );
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar a denúncia.");
    } finally {
      setPendingId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nenhuma denúncia aqui.</p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card
          key={report.id}
          className="chaos-card border-border bg-card border"
        >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {targetLabel[report.targetType]} · {report.reporterName}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {report.reason}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Date(report.createdAt).toLocaleString("pt-BR")} ·{" "}
                {report.status}
              </p>
            </div>
            {report.status === "open" ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pendingId === report.id}
                  onClick={() => void setStatus(report.id, "resolved")}
                >
                  Resolver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pendingId === report.id}
                  onClick={() => void setStatus(report.id, "dismissed")}
                >
                  Dispensar
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
