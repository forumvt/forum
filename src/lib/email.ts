import { Resend } from "resend";

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

/**
 * Envia e-mail via Resend. Em dev sem credenciais, registra aviso e resolve.
 * Chamadores em fluxos sensíveis a timing devem usar `void sendEmail(...)` (fire-and-forget).
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM;
  const resend = getResend();
  if (!resend || !from) {
    console.warn(
      "[email] RESEND_API_KEY ou EMAIL_FROM ausentes; e-mail não enviado.",
    );
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html: html ?? `<p>${text.replace(/\n/g, "<br/>")}</p>`,
  });

  if (error) {
    console.error("[email] Falha ao enviar:", error);
  }
}
