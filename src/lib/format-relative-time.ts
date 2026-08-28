export function formatRelativeTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const then = (value instanceof Date ? value : new Date(value)).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(then).toLocaleDateString("pt-BR");
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatClockTime(
  value: Date | string | null | undefined,
): string {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatReplyWhen(
  value: Date | string | null | undefined,
): string {
  const date = parseDate(value);
  if (!date) return "";

  const now = new Date();
  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 60_000),
  );
  if (diffMinutes < 60) return "agora há pouco";

  const time = formatClockTime(date);
  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );

  if (dayDiff === 0) return `Hoje às ${time}`;
  if (dayDiff === 1) return `Ontem às ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    return `${WEEKDAYS[date.getDay()]} às ${time}`;
  }
  return `${date.toLocaleDateString("pt-BR")} às ${time}`;
}
