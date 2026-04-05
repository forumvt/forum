import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço | VT Forums",
  description:
    "Regras de uso da plataforma VT Forums: cadastro, conteúdo publicado e conduta na comunidade.",
};

const UPDATED = "22 de março de 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-16">
      <nav className="text-muted-foreground mb-8 text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Início
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
      </nav>

      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Termos de Serviço
          </h1>
          <p className="text-muted-foreground text-sm">
            Última atualização: {UPDATED}
          </p>
        </header>

        <p className="text-muted-foreground leading-relaxed">
          Ao acessar ou usar o VT Forums (&quot;nós&quot;, &quot;plataforma&quot;), você
          concorda com estes Termos de Serviço. Se não concordar, não utilize o
          serviço. Este texto é um modelo informativo; revise com assessoria jurídica
          antes de uso em produção.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            1. Conta e cadastro
          </h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            <li>
              Você deve fornecer informações verdadeiras e manter sua senha em
              sigilo.
            </li>
            <li>
              É responsável por toda atividade feita com sua conta. Comunique-nos
              imediatamente em caso de uso não autorizado.
            </li>
            <li>
              Podemos suspender ou encerrar contas que violem estes termos ou a lei.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            2. Uso permitido
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            O VT Forums destina-se a discussões respeitosas. É proibido usar a
            plataforma para spam, assédio, discurso de ódio, conteúdo ilegal,
            malware, ou para prejudicar outros usuários ou a infraestrutura do
            serviço.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            3. Conteúdo dos usuários
          </h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            <li>
              Você mantém os direitos sobre o que publica, mas nos concede uma
              licença não exclusiva para hospedar, exibir e distribuir esse conteúdo
              no contexto do serviço.
            </li>
            <li>
              Você declara ter direito de publicar o material enviado e que ele não
              infringe direitos de terceiros.
            </li>
            <li>
              Podemos remover conteúdo ou contas quando necessário para cumprir a
              lei, proteger a comunidade ou estes termos.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            4. Modificações e disponibilidade
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos alterar ou descontinuar funcionalidades a qualquer momento.
            Alterações relevantes a estes termos serão indicadas na plataforma ou
            por e-mail quando aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            5. Isenção e limitação
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            O serviço é oferecido &quot;no estado em que se encontra&quot;. Na medida
            permitida pela lei, não nos responsabilizamos por danos indiretos ou
            perda de dados decorrentes do uso da plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            6. Contato
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Dúvidas sobre estes termos:{" "}
            <a
              href="mailto:erisangela99@gmail.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              erisangela99@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
