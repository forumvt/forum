import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | VT Forums",
  description:
    "Como o VT Forums trata dados pessoais: coleta, uso, cookies e seus direitos.",
};

const UPDATED = "22 de março de 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-16">
      <nav className="text-muted-foreground mb-8 text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Início
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="text-primary hover:underline">
          Termos de Serviço
        </Link>
      </nav>

      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground text-sm">
            Última atualização: {UPDATED}
          </p>
        </header>

        <p className="text-muted-foreground leading-relaxed">
          Esta política descreve como o VT Forums (&quot;nós&quot;) trata dados
          pessoais quando você usa o site. Ela segue a LGPD (Lei nº 13.709/2018) como
          referência. Ajuste os detalhes (bases legais, DPO, prazos) conforme sua
          operação real e consulte um profissional de privacidade.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            1. Quem somos
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Operador da plataforma VT Forums. Os dados são tratados para prestação do
            serviço de fórum, autenticação, moderação e melhoria da experiência.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            2. Dados que podemos coletar
          </h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            <li>
              <strong className="text-foreground">Cadastro:</strong> nome ou
              apelido, e-mail e credenciais de acesso (senha armazenada de forma
              segura, por exemplo com hash).
            </li>
            <li>
              <strong className="text-foreground">Uso:</strong> posts, mensagens
              públicas, preferências da conta e registros técnicos (IP, tipo de
              navegador, data/hora), quando necessário para segurança e funcionamento.
            </li>
            <li>
              <strong className="text-foreground">Mídia:</strong> avatares ou
              arquivos que você enviar voluntariamente.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            3. Finalidades e bases legais
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Tratamos dados para executar o contrato de uso do serviço, cumprir
            obrigações legais, legítimo interesse (segurança, prevenção a fraudes,
            estatísticas agregadas) e, quando exigido, com seu consentimento
            explícito (por exemplo, comunicações opcionais).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            4. Compartilhamento
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos compartilhar dados com provedores que nos auxiliam (hospedagem,
            e-mail transacional, armazenamento de imagens), sempre com contratos e
            medidas adequadas de proteção. Conteúdo público do fórum pode ser visível
            a outros usuários e, em alguns casos, indexado por buscadores, conforme
            as configurações do produto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            5. Retenção
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Mantemos os dados pelo tempo necessário para as finalidades descritas,
            resolução de disputas e cumprimento legal. Você pode solicitar exclusão da
            conta conforme nossos processos internos e a lei.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            6. Seus direitos (LGPD)
          </h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            <li>Confirmação de tratamento e acesso aos dados.</li>
            <li>Correção de dados incompletos ou desatualizados.</li>
            <li>
              Anonimização, bloqueio ou eliminação de dados desnecessários ou
              tratados em desconformidade.
            </li>
            <li>Portabilidade, quando aplicável.</li>
            <li>Informação sobre compartilhamentos e revogação de consentimento.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Para exercer direitos, use o canal de contato indicado no site. Você também
            pode registrar reclamação à Autoridade Nacional de Proteção de Dados
            (ANPD).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            7. Cookies e tecnologias similares
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies ou armazenamento local quando necessário para sessão,
            preferências (tema) e métricas. Você pode restringir cookies no seu
            navegador; isso pode afetar algumas funcionalidades.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            8. Segurança
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Adotamos medidas técnicas e organizacionais razoáveis para proteger seus
            dados. Nenhum sistema é 100% seguro; use senha forte e não compartilhe sua
            conta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            9. Alterações
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos atualizar esta política. A data no topo indica a versão vigente.
            Mudanças relevantes serão comunicadas de forma apropriada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            10. Contato
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Para questões de privacidade ou encarregado de dados (DPO), entre em
            contato:{" "}
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
