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
  type ResetPasswordFormValues,
  resetPasswordFormSchema,
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
      <Card className="bg-background shadow-lg">
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
      <Card className="bg-background shadow-lg">
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
    <Card className="bg-background shadow-lg">
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
                    <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
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
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
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
                    <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
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
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirm((s) => !s)}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
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
    <Card className="bg-background shadow-lg">
      <CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">
        Carregando…
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[100vh] flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-1 items-center justify-center rounded-xl bg-muted/50 p-6 md:min-h-min">
        <div className="w-full max-w-md space-y-6">
          <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
