import { assertCooldown, type FloodAction } from "@/lib/anti-flood";
import { assertUniqueContent } from "@/lib/anti-spam";
import { isStaff } from "@/lib/permissions";
import {
  type AbuseBlockResult,
  checkRateLimit,
  type RateLimitKind,
  type WriteAbuseError,
} from "@/lib/rate-limit";
import * as userRepo from "@/repositories/user.repository";

export type { AbuseBlockResult,WriteAbuseError };

export async function isStaffUser(userId: string): Promise<boolean> {
  const role = await userRepo.findRoleById(userId);
  return isStaff(role);
}

export async function assertWriteAbuseChecks(
  userId: string,
  options: {
    rateLimit: RateLimitKind;
    flood?: FloodAction;
    content?: string;
  },
): Promise<AbuseBlockResult> {
  if (await isStaffUser(userId)) return { ok: true };

  const rate = await checkRateLimit(options.rateLimit, userId);
  if (!rate.ok) return rate;

  if (options.flood) {
    const flood = await assertCooldown(options.flood, userId);
    if (!flood.ok) return flood;
  }

  if (options.content !== undefined) {
    const spam = await assertUniqueContent(userId, options.content);
    if (!spam.ok) return spam;
  }

  return { ok: true };
}

export function abuseErrorMessage(error: WriteAbuseError): string {
  switch (error) {
    case "rate_limited":
      return "Muitas ações em pouco tempo. Aguarde antes de tentar novamente.";
    case "cooldown":
      return "Aguarde um momento antes de enviar novamente.";
    case "duplicate_content":
      return "Você já enviou este conteúdo recentemente.";
  }
}

export function abuseErrorStatus(error: WriteAbuseError): number {
  switch (error) {
    case "duplicate_content":
      return 409;
    case "rate_limited":
    case "cooldown":
      return 429;
  }
}

export function mapAbuseError(result: {
  error: WriteAbuseError;
  retryAfterSeconds?: number;
}) {
  return {
    error: abuseErrorMessage(result.error),
    retryAfterSeconds: result.retryAfterSeconds,
  };
}
