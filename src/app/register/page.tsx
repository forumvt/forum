"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getPublicAppUrl } from "@/lib/app-url"
import { authClient } from "@/lib/auth-client"
import {
  registerFormBaseSchema,
  type RegisterFormValues,
} from "@/lib/register-schema"

const formSchema = registerFormBaseSchema

type FormValues = RegisterFormValues

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.signUp.email({
      name: values.username,
      email: values.email,
      password: values.password,
      callbackURL: `${getPublicAppUrl()}/`,
    })

    if (error) {
      const msg = (error.message ?? "").toLowerCase()
      if (msg.includes("already") || msg.includes("exist")) {
        toast.error("E-mail já cadastrado")
        form.setError("email", { message: "E-mail já cadastrado" })
        return
      }
      toast.error(error.message ?? "Não foi possível criar a conta.")
      return
    }

    setRegistrationSuccess(true)
    toast.success(
      "Enviamos um e-mail de confirmação. Verifique sua caixa de entrada.",
    )
  }

  return (
    <>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-muted/50 flex flex-1 items-center justify-center rounded-xl px-4 py-8 sm:p-6">
            <div className="w-full max-w-md space-y-6">
              {/* Formulário Principal */}
              <Card className="bg-card shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl text-center">Cadastro</CardTitle>
                  <CardDescription className="text-center">
                    Digite seus dados para criar uma nova conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registrationSuccess ? (
                    <div className="space-y-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Abra o link no e-mail para confirmar o cadastro. Depois você
                        poderá entrar normalmente.
                      </p>
                      <Button type="button" onClick={() => router.push("/")}>
                        Ir ao início
                      </Button>
                    </div>
                  ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Campo Nome */}
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome usuario</FormLabel>
                            <div className="relative">
                              <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Seu nome de usuario"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Campo Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <div className="relative">
                              <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="seu@email.com"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Campo Senha */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <div className="relative">
                              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Crie uma senha forte"
                                  className="pl-10 pr-10"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                                aria-label={
                                  showPassword
                                    ? "Ocultar senha"
                                    : "Mostrar senha"
                                }
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff /> : <Eye />}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Campo Confirmar Senha */}
                      <FormField
                        control={form.control}
                        name="passwordConfirmation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar senha</FormLabel>
                            <div className="relative">
                              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <FormControl>
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirme sua senha"
                                  className="pl-10 pr-10"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground absolute top-1/2 right-1 size-7 -translate-y-1/2"
                                aria-label={
                                  showConfirmPassword
                                    ? "Ocultar confirmação de senha"
                                    : "Mostrar confirmação de senha"
                                }
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Aceitar Termos */}
                      {/* <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Aceito os{" "}
                                <Link href="/terms" className="text-primary hover:underline">
                                  Termos de Serviço
                                </Link>{" "}
                                e{" "}
                                <Link href="/privacy" className="text-primary hover:underline">
                                  Política de Privacidade
                                </Link>
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}

                      {/* Botão de Cadastro */}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            <span>Criando conta...</span>
                          </>
                        ) : (
                          "Criar conta"
                        )}
                      </Button>
                    </form>
                  </Form>
                  )}
                </CardContent>
              </Card>

              {/* Link para Login */}
              <Card className="bg-card shadow-sm">
                <CardContent className="pt-6">
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">Já tem uma conta? </span>
                    <Link
                      href="/"
                      className="text-primary hover:underline font-medium"
                    >
                      Fazer login
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </>
  )
}
