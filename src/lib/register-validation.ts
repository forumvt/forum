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
  const at = email.indexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
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
  if (!isAllowedEmailDomainsConfigured()) {
    return { ok: false, message: REGISTER_MSG_EMAIL_CONFIG };
  }
  if (!isEmailDomainAllowed(email)) {
    return { ok: false, message: REGISTER_MSG_EMAIL_DOMAIN };
  }
  if (email.trim().toLowerCase() === password.trim().toLowerCase()) {
    return { ok: false, message: REGISTER_MSG_PASSWORD_EQUALS_EMAIL };
  }
  if (/^[a-z]+$/.test(password)) {
    return { ok: false, message: REGISTER_MSG_PASSWORD_ONLY_LOWERCASE };
  }
  return { ok: true };
}
