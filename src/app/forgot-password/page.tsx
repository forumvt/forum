"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { getPublicAppUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.email("E-mail inválido."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    const base = getPublicAppUrl();
    const redirectTo = `${base}/reset-password`;

    const { error } = await authClient.requestPasswordReset({
      email: values.email.trim(),
      redirectTo,
    });

    if (error) {
      toast.error(error.message ?? "Não foi possível enviar o e-mail.");
      return;
    }

    setSubmitted(true);
    toast.success(
      "Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.",
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col gap-4 p-4">
      <div className="bg-muted/50 flex flex-1 items-center justify-center rounded-xl px-4 py-8 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <Card className="bg-card shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl">
                Esqueci a senha
              </CardTitle>
              <CardDescription className="text-center">
                Informe seu e-mail. Se houver uma conta, enviaremos um link para
                redefinir a senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <p className="text-muted-foreground text-center text-sm">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <div className="relative">
                            <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-10"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Enviando…" : "Enviar link"}
                    </Button>
                  </form>
                </Form>
              )}
              <div className="mt-6 text-center text-sm">
                <Link
                  href="/"
                  className="text-primary font-medium hover:underline"
                >
                  Voltar ao início
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
