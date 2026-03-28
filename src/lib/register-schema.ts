import { z } from "zod";

import {
  REGISTER_MSG_EMAIL_CONFIG,
  REGISTER_MSG_EMAIL_DOMAIN,
  REGISTER_MSG_PASSWORD_EQUALS_EMAIL,
  REGISTER_MSG_PASSWORD_ONLY_LOWERCASE,
  isEmailDomainAllowed,
  parseAllowedEmailDomains,
} from "@/lib/register-validation";

const registerFields = z.object({
  username: z
    .string("Nome de usuario inválido.")
    .trim()
    .min(1, "Nome de usuario é obrigatório."),
  email: z
    .email("E-mail inválido.")
    .refine(() => parseAllowedEmailDomains().length > 0, {
      message: REGISTER_MSG_EMAIL_CONFIG,
    })
    .refine(isEmailDomainAllowed, {
      message: REGISTER_MSG_EMAIL_DOMAIN,
    }),
  password: z
    .string("Senha inválida.")
    .min(8, "Senha inválida.")
    .refine((p) => !/^[a-z]+$/.test(p), {
      message: REGISTER_MSG_PASSWORD_ONLY_LOWERCASE,
    }),
  passwordConfirmation: z.string("Senha inválida.").min(8, "Senha inválida."),
});

export const registerFormBaseSchema = registerFields
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  })
  .refine(
    (data) =>
      data.email.trim().toLowerCase() !== data.password.trim().toLowerCase(),
    {
      message: REGISTER_MSG_PASSWORD_EQUALS_EMAIL,
      path: ["password"],
    },
  );

export const registerDialogFormSchema = registerFields
  .extend({
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Você precisa aceitar os termos para continuar.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  })
  .refine(
    (data) =>
      data.email.trim().toLowerCase() !== data.password.trim().toLowerCase(),
    {
      message: REGISTER_MSG_PASSWORD_EQUALS_EMAIL,
      path: ["password"],
    },
  );

export type RegisterFormValues = z.infer<typeof registerFormBaseSchema>;
export type RegisterDialogFormValues = z.infer<typeof registerDialogFormSchema>;
