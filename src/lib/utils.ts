import { type ClassValue,clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMemberSince(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const parsed = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function formatJoinedOn(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const parsed = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function userInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

export function displayUserName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed || "Usuário Anônimo";
}