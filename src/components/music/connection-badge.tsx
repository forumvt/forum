"use client";

import { cn } from "@/lib/utils";
import type { MusicConnectionStatus } from "@/types/music";

const LABELS: Record<MusicConnectionStatus, string> = {
  loading: "Carregando…",
  connecting: "Conectando…",
  connected: "Online",
  disconnected: "Desconectado",
  reconnecting: "Reconectando…",
  error: "Erro de conexão",
};

export function ConnectionBadge({
  status,
}: {
  status: MusicConnectionStatus;
}) {
  const tone =
    status === "connected"
      ? "bg-emerald-500"
      : status === "reconnecting" || status === "connecting" || status === "loading"
        ? "bg-amber-400"
        : "bg-red-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "connected"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : status === "error" || status === "disconnected"
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
      )}
    >
      <span className={cn("size-2 rounded-full", tone, status === "reconnecting" && "animate-pulse")} />
      {LABELS[status]}
    </span>
  );
}
