"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicAppUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import {
  registerDialogFormSchema,
  type RegisterDialogFormValues,
} from "@/lib/register-schema";

const formSchema = registerDialogFormSchema;

type FormValues = RegisterDialogFormValues;
export function RegisterDialog() {
  const [open, setOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.username,
        email: values.email,
        password: values.password,
        callbackURL: `${getPublicAppUrl()}/`,
      });
      if (error) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("already") || msg.includes("exist")) {
          toast.error("E-mail já cadastrado");
          form.setError("email", { message: "E-mail já cadastrado" });
          return;
        }
        toast.error(error.message ?? "Não foi possível criar a conta.");
        return;
      }
      setRegistrationSuccess(true);
      toast.success(
        "Enviamos um e-mail de confirmação. Verifique sua caixa de entrada.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleSignUpWithGoogle = async () => {
    const accepted = form.getValues("acceptTerms");
    if (!accepted) {
      form.setError("acceptTerms", {
        message: "Aceite os termos para continuar.",
      });
      toast.error("Aceite os Termos de Serviço para se cadastrar com Google.");
      return;
    }
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${getPublicAppUrl()}/`,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setRegistrationSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Registrar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Registrar</DialogTitle>
          <DialogDescription>
            {registrationSuccess
              ? "Próximo passo: confirme pelo link que enviamos."
              : "Preencha seus dados para criar sua conta."}
          </DialogDescription>
        </DialogHeader>

        {registrationSuccess ? (
          <div className="text-muted-foreground space-y-4 text-center text-sm">
            <p>
              Abra o e-mail e clique no link para ativar a conta. Depois você
              pode entrar pelo botão Entrar.
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reg-name">Nome completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="reg-name"
                        placeholder="Seu nome"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reg-email">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="voce@email.com"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reg-password">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="reg-password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 pl-9"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={
                          showPass ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPass ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="reg-confirm">Confirmar senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="reg-confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 pl-9"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label={
                          showConfirm
                            ? "Ocultar confirmação"
                            : "Mostrar confirmação"
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox
                        id="tos"
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(c === true)}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="grid gap-1.5 leading-snug">
                      <Label
                        htmlFor="tos"
                        className="text-sm font-normal text-muted-foreground cursor-pointer"
                      >
                        Li e aceito os{" "}
                        <Link
                          href={"/terms" as never}
                          className="text-primary underline-offset-4 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Termos de Serviço
                        </Link>{" "}
                        e a{" "}
                        <Link
                          href={"/privacy" as never}
                          className="text-primary underline-offset-4 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Política de Privacidade
                        </Link>
                        .
                      </Label>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {loading ? "Criando conta..." : "Registrar"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignUpWithGoogle}
              type="button"
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Registrar com Google
            </Button>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
