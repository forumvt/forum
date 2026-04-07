import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/email";
import {
  normalizeEmailStripBrDomain,
  validateRegistrationCredentials,
} from "@/lib/register-validation";
import { getTrustedOrigins } from "@/lib/auth-cors";

const authBaseUrl =
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

const trustedOrigins = getTrustedOrigins();

const DEFAULT_USER_IMAGE =
  "https://www.subeiros.com/eris-apple.png";

export const auth = betterAuth({
  baseURL: authBaseUrl || undefined,
  ...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const emailPaths = ["/sign-up/email", "/sign-in/email", "/forget-password"];
      if (emailPaths.includes(ctx.path)) {
        const body = ctx.body as { email?: unknown };
        if (typeof body.email === "string") {
          body.email = normalizeEmailStripBrDomain(body.email);
        }
      }
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      const body = ctx.body as {
        email?: unknown;
        password?: unknown;
      };
      const email = typeof body.email === "string" ? body.email : "";
      const password =
        typeof body.password === "string" ? body.password : "";
      const result = validateRegistrationCredentials(email, password);
      if (!result.ok) {
        throw new APIError("BAD_REQUEST", {
          message: result.message,
        });
      }
    }),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Confirme seu e-mail — Forum VT",
        text: `Olá${user.name ? `, ${user.name}` : ""},

Use o link abaixo para confirmar seu endereço de e-mail:

${url}

Se você não criou uma conta, ignore esta mensagem.`,
        html: `<p>Olá${user.name ? `, ${user.name}` : ""},</p><p>Use o botão abaixo para confirmar seu endereço de e-mail.</p><p><a href="${url}">Confirmar e-mail</a></p><p>Se você não criou uma conta, ignore esta mensagem.</p>`,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    customSyntheticUser: ({
      coreFields,
      additionalFields,
      id,
    }: {
      coreFields: Record<string, unknown> & { image?: string | null };
      additionalFields: Record<string, unknown>;
      id: string;
    }) => ({
      ...coreFields,
      image: coreFields.image ?? DEFAULT_USER_IMAGE,
      ...additionalFields,
      role: "USER",
      id,
    }),
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Redefinição de senha — Forum VT",
        text: `Olá${user.name ? `, ${user.name}` : ""},

Recebemos um pedido para redefinir a senha da sua conta. Acesse o link:

${url}

Se você não solicitou, ignore este e-mail.`,
        html: `<p>Olá${user.name ? `, ${user.name}` : ""},</p><p>Recebemos um pedido para redefinir a senha da sua conta.</p><p><a href="${url}">Redefinir senha</a></p><p>Se você não solicitou, ignore este e-mail.</p>`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema,
  }),
  user: {
    modelName: "userTable",
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  account: {
    modelName: "accountTable",
  },
  session: {
    modelName: "sessionTable",
  },
  verification: {
    modelName: "verificationTable",
  },
});
