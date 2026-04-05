"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { getPublicAppUrl } from "@/lib/app-url";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <Button className="bg-blue-600 text-white hover:bg-blue-700">
          Registrar
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Registrar
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {registrationSuccess
              ? "Próximo passo: confirme pelo link que enviamos."
              : "Preencha seus dados para criar sua conta."}
          </DialogDescription>
        </DialogHeader>

        {registrationSuccess ? (
          <div className="space-y-4 text-center text-sm text-gray-600">
            <p>
              Abra o e-mail e clique no link para ativar a conta. Depois você
              pode entrar pelo botão Entrar.
            </p>
            <Button
              type="button"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
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
                        className="absolute top-1/2 right-1 -translate-y-1/2"
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
                        className="absolute top-1/2 right-1 -translate-y-1/2"
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
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Registrar"}
            </Button>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
