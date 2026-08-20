"use client";

import type { UserPreview } from "@/types/user";

export const userPreviewCache = new Map<string, UserPreview>();

export function patchUserPreview(
  userId: string,
  patch: Partial<UserPreview>,
): void {
  const current = userPreviewCache.get(userId);
  if (!current) return;
  userPreviewCache.set(userId, { ...current, ...patch });
}
