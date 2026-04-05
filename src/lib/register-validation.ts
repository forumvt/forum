/**
 * Remove o sufixo `.br` do domínio (ex.: `user@empresa.com.br` → `user@empresa.com`).
 * Também aplica trim e minúsculas no endereço inteiro.
 */
export function normalizeEmailStripBrDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 0) return trimmed;
  const local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  if (domain.endsWith(".br")) {
    domain = domain.slice(0, -3);
  }
  return `${local}@${domain}`;
}

/** Lista de domínios em NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS (vírgula, case-insensitive). */
export function parseAllowedEmailDomains(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmailDomainsConfigured(): boolean {
  return parseAllowedEmailDomains().length > 0;
}

export function isEmailDomainAllowed(email: string): boolean {
  const domains = parseAllowedEmailDomains();
  if (domains.length === 0) return false;
  const normalized = normalizeEmailStripBrDomain(email);
  const at = normalized.indexOf("@");
  if (at < 0) return false;
  const domain = normalized.slice(at + 1);
  return domains.includes(domain);
}

export const REGISTER_MSG_EMAIL_CONFIG =
  "Cadastro por e-mail indisponível. Defina NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS.";

export const REGISTER_MSG_EMAIL_DOMAIN =
  "Use um e-mail de um domínio autorizado.";

export const REGISTER_MSG_PASSWORD_EQUALS_EMAIL =
  "A senha não pode ser igual ao e-mail.";

export const REGISTER_MSG_PASSWORD_ONLY_LOWERCASE =
  "A senha não pode conter apenas letras minúsculas.";

export function validateRegistrationCredentials(
  email: string,
  password: string,
): { ok: true } | { ok: false; message: string } {
  const normalizedEmail = normalizeEmailStripBrDomain(email);
  if (!isAllowedEmailDomainsConfigured()) {
    return { ok: false, message: REGISTER_MSG_EMAIL_CONFIG };
  }
  if (!isEmailDomainAllowed(normalizedEmail)) {
    return { ok: false, message: REGISTER_MSG_EMAIL_DOMAIN };
  }
  if (normalizedEmail === password.trim().toLowerCase()) {
    return { ok: false, message: REGISTER_MSG_PASSWORD_EQUALS_EMAIL };
  }
  if (/^[a-z]+$/.test(password)) {
    return { ok: false, message: REGISTER_MSG_PASSWORD_ONLY_LOWERCASE };
  }
  return { ok: true };
}
