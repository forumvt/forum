import Link from "next/link";

export default function UserNotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-foreground mb-2 text-2xl font-bold">
        Usuário não encontrado
      </h1>
      <p className="text-muted-foreground mb-6">
        Este perfil não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="text-primary font-medium underline-offset-2 hover:underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
