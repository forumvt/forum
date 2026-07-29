"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/register-schema";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  });

  const { isSubmitting } = form.formState;

  if (errorParam === "INVALID_TOKEN") {
    return (
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Link inválido ou expirado
          </CardTitle>
          <CardDescription className="text-center">
            Solicite um novo link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <Link href="/forgot-password">Pedir novo link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Token ausente
          </CardTitle>
          <CardDescription className="text-center">
            Use o link enviado por e-mail para definir uma nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <Link href="/forgot-password">Esqueci a senha</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return;
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      toast.error(error.message ?? "Não foi possível redefinir a senha.");
      return;
    }

    toast.success("Senha redefinida. Você já pode entrar.");
    router.push("/");
  }

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl">Nova senha</CardTitle>
        <CardDescription className="text-center">
          Escolha uma nova senha para sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <div className="relative">
                    <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <div className="relative">
                    <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <FormControl>
                      <Input
                        type={showConfirm ? "text" : "password"}
                        className="pl-10 pr-10"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                      aria-label={
                        showConfirm
                          ? "Ocultar confirmação de senha"
                          : "Mostrar confirmação de senha"
                      }
                      onClick={() => setShowConfirm((s) => !s)}
                    >
                      {showConfirm ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordFallback() {
  return (
    <Card className="bg-card shadow-lg">
      <CardContent className="text-muted-foreground py-8 text-center text-sm">
        Carregando…
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col gap-4 p-4">
      <div className="bg-muted/50 flex flex-1 items-center justify-center rounded-xl px-4 py-8 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
