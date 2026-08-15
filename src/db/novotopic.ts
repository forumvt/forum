import { eq, inArray } from "drizzle-orm";

import { db } from ".";
import { forumTable, postTable, threadTable, userTable } from "./schema";

const THREAD_SLUG = "as-coincidencias-aumentam-quando-comecamos-a-observar";
const DEFAULT_FORUM_SLUG = "vale-tudo";

const authors = [
  {
    id: "coincidence-topic-eris-signal",
    name: "🍎 ErisSignal",
    email: "eris-signal@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-static-eye",
    name: "📺 StaticEye",
    email: "static-eye@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-oracle-zero",
    name: "🔮 OracleZero",
    email: "oracle-zero@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-pattern-breaker",
    name: "🧩 PatternBreaker",
    email: "pattern-breaker@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-grey-archive",
    name: "📚 GreyArchive",
    email: "grey-archive@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-five-finger",
    name: "🖐 FiveFinger",
    email: "five-finger@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-null-theory",
    name: "👁 NullTheory",
    email: "null-theory@coincidence-topic.forumvt.local",
  },
  {
    id: "coincidence-topic-chaos-engine",
    name: "⚙ ChaosEngine",
    email: "chaos-engine@coincidence-topic.forumvt.local",
  },
] as const;

type AuthorId = (typeof authors)[number]["id"];

const replies: Array<{ authorId: AuthorId; content: string }> = [
  {
    authorId: "coincidence-topic-static-eye",
    content:
      "Isso já aconteceu comigo.\n\nComecei a prestar atenção no número 23 e, de repente, ele aparecia em placas, horários, recibos e números de apartamentos.\n\nDurante algumas semanas parecia que o número estava me perseguindo.",
  },
  {
    authorId: "coincidence-topic-pattern-breaker",
    content:
      "[quote=📺 StaticEye]Durante algumas semanas parecia que o número estava me perseguindo.[/quote]\n\nOu você simplesmente passou a perceber algo que sempre esteve presente.\n\nQuantos outros números apareceram no mesmo período e você ignorou?",
  },
  {
    authorId: "coincidence-topic-static-eye",
    content:
      "Eu pensei nisso.\n\nMas algumas ocorrências eram muito específicas.\n\nUma vez acordei às 2:23, peguei um ônibus de número 23 e meu pedido no restaurante ficou em R$ 23,23.",
  },
  {
    authorId: "coincidence-topic-oracle-zero",
    content:
      "Quando várias coincidências acontecem no mesmo dia, fica difícil aceitar que seja apenas atenção seletiva.\n\nTalvez certos padrões apareçam quando estamos no caminho de alguma mudança.",
  },
  {
    authorId: "coincidence-topic-null-theory",
    content:
      "[quote=🔮 OracleZero]Talvez certos padrões apareçam quando estamos no caminho de alguma mudança.[/quote]\n\nMas como você distingue um sinal real de uma coincidência comum?\n\nSe qualquer repetição puder ser interpretada como mensagem, então nenhuma interpretação poderá ser testada.",
  },
  {
    authorId: "coincidence-topic-oracle-zero",
    content:
      "Talvez o significado não esteja no número em si.\n\nPode estar na reação da pessoa ao perceber o padrão.\n\nÀs vezes a coincidência serve apenas para chamar nossa atenção.",
  },
  {
    authorId: "coincidence-topic-eris-signal",
    content:
      "Foi justamente isso que comecei a questionar.\n\nTalvez a coincidência não seja uma mensagem externa.\n\nTalvez seja a mente reorganizando a realidade ao redor de uma ideia que ganhou importância.",
  },
  {
    authorId: "coincidence-topic-grey-archive",
    content:
      "Existe um conceito chamado ilusão de frequência.\n\nDepois que você aprende ou percebe algo, passa a encontrá-lo com mais frequência porque sua atenção ficou preparada para reconhecê-lo.\n\nO fenômeno também é associado ao efeito Baader-Meinhof.",
  },
  {
    authorId: "coincidence-topic-five-finger",
    content:
      "[quote=📚 GreyArchive]Existe um conceito chamado ilusão de frequência.[/quote]\n\nIsso explica perceber mais vezes.\n\nMas não explica coincidências compostas, quando várias coisas relacionadas acontecem juntas e na ordem certa.",
  },
  {
    authorId: "coincidence-topic-pattern-breaker",
    content:
      "Pode explicar, sim.\n\nVocê está contando as sequências que deram certo, mas provavelmente não está registrando todas as vezes em que esperou uma coincidência e nada aconteceu.",
  },
  {
    authorId: "coincidence-topic-five-finger",
    content:
      "Então como poderíamos testar isso sem depender apenas da memória?\n\nPorque dizer que toda experiência é viés também pode virar uma forma de encerrar qualquer investigação.",
  },
  {
    authorId: "coincidence-topic-chaos-engine",
    content:
      "Daria para escolher antecipadamente cinco números e registrar durante trinta dias todas as aparições deles.\n\nTambém seria necessário registrar números de controle que não tenham significado pessoal.\n\nDepois comparamos as frequências.",
  },
  {
    authorId: "coincidence-topic-null-theory",
    content:
      "A ideia é boa, mas o critério precisa ser definido antes.\n\nPor exemplo: olhar voluntariamente para um relógio conta?\n\nEncontrar o número dentro de uma sequência maior conta?\n\nSem essas regras, a pessoa pode adaptar o resultado depois.",
  },
  {
    authorId: "coincidence-topic-static-eye",
    content:
      "Eu faria o teste.\n\nEscolheria o 23, que já tem significado para mim, e outros quatro números sorteados aleatoriamente.\n\nAssim daria para comparar o número especial com números neutros.",
  },
  {
    authorId: "coincidence-topic-oracle-zero",
    content:
      "Só existe um problema.\n\nNo momento em que os números neutros forem escolhidos, eles também passarão a ocupar sua atenção.\n\nTalvez todos comecem a aparecer mais.",
  },
  {
    authorId: "coincidence-topic-pattern-breaker",
    content:
      "[quote=🔮 OracleZero]Talvez todos comecem a aparecer mais.[/quote]\n\nE isso seria justamente uma evidência a favor da explicação psicológica.\n\nA frequência do mundo não mudou.\n\nO filtro de atenção da pessoa mudou.",
  },
  {
    authorId: "coincidence-topic-eris-signal",
    content:
      "Então temos duas hipóteses interessantes.\n\nA primeira é que os padrões existem independentemente de quem observa.\n\nA segunda é que o observador cria o padrão ao selecionar partes da realidade.\n\nTalvez o experimento não revele uma mensagem escondida, mas revele como nossa atenção fabrica significado.",
  },
  {
    authorId: "coincidence-topic-five-finger",
    content:
      "E existe uma terceira possibilidade.\n\nO padrão pode ser criado pela mente e ainda assim produzir uma mudança real na vida da pessoa.\n\nUma interpretação não precisa ser sobrenatural para ter consequências.",
  },
  {
    authorId: "coincidence-topic-grey-archive",
    content:
      "Essa é provavelmente a parte mais interessante.\n\nUma coincidência pode não ser uma mensagem objetiva do universo, mas pode funcionar como símbolo, motivação ou gatilho para uma decisão.\n\nO significado seria psicológico, não necessariamente cósmico.",
  },
  {
    authorId: "coincidence-topic-eris-signal",
    content:
      "Gostei dessa conclusão.\n\nVou registrar as ocorrências durante trinta dias, incluindo as vezes em que nada acontecer.\n\nDepois publico os dados completos aqui, mesmo que o resultado destrua completamente minha hipótese.\n\nEris provavelmente aprovaria a confusão. 🍎",
  },
];

async function findOrCreateForum(forumSlug: string) {
  const [existingForum] = await db
    .select({
      id: forumTable.id,
      slug: forumTable.slug,
    })
    .from(forumTable)
    .where(eq(forumTable.slug, forumSlug))
    .limit(1);

  if (existingForum) {
    return existingForum;
  }

  if (forumSlug !== DEFAULT_FORUM_SLUG) {
    throw new Error(
      `O fórum "${forumSlug}" não existe. Informe um slug válido ou use o padrão "${DEFAULT_FORUM_SLUG}".`,
    );
  }

  const [createdForum] = await db
    .insert(forumTable)
    .values({
      category: "VALE_TUDO",
      title: "Vale Tudo",
      slug: DEFAULT_FORUM_SLUG,
      description: "Discussões gerais sobre diversos temas",
    })
    .returning({
      id: forumTable.id,
      slug: forumTable.slug,
    });

  if (!createdForum) {
    throw new Error("Não foi possível criar o fórum Vale Tudo.");
  }

  return createdForum;
}

async function main() {
  const forumSlug = process.argv[2] ?? DEFAULT_FORUM_SLUG;

  const [existingThread] = await db
    .select({
      id: threadTable.id,
    })
    .from(threadTable)
    .where(eq(threadTable.slug, THREAD_SLUG))
    .limit(1);

  if (existingThread) {
    console.log(
      `ℹ️ O tópico "${THREAD_SLUG}" já existe; nenhuma alteração foi feita.`,
    );
    return;
  }

  const forum = await findOrCreateForum(forumSlug);
  const now = new Date();

  const threadCreatedAt = new Date(now.getTime() - replies.length * 60_000);

  await db.transaction(async (tx) => {
    await tx
      .insert(userTable)
      .values(
        authors.map((author) => ({
          ...author,
          emailVerified: false,
          role: "USER" as const,
          createdAt: threadCreatedAt,
          updatedAt: threadCreatedAt,
        })),
      )
      .onConflictDoNothing();

    const savedAuthors = await tx
      .select({
        id: userTable.id,
      })
      .from(userTable)
      .where(
        inArray(
          userTable.email,
          authors.map((author) => author.email),
        ),
      );

    if (savedAuthors.length !== authors.length) {
      throw new Error(
        "Não foi possível criar ou localizar todos os autores do tópico.",
      );
    }

    const [thread] = await tx
      .insert(threadTable)
      .values({
        title: "As coincidências aumentam quando começamos a observá-las?",
        slug: THREAD_SLUG,
        description:
          "Nas últimas semanas comecei a perceber muitas coincidências envolvendo os mesmos números, palavras e símbolos.\n\nQuanto mais presto atenção, mais eles aparecem.\n\nIsso acontece porque os padrões realmente estão aumentando ou porque minha mente passou a selecionar coisas que antes ignorava?\n\nAlguém já tentou registrar esse tipo de experiência de maneira objetiva?",
        forumId: forum.id,
        userId: "coincidence-topic-eris-signal",
        createdAt: threadCreatedAt,
        updatedAt: now,
        lastPostAt: now,
        lastPostUserId: replies.at(-1)?.authorId,
      })
      .returning({
        id: threadTable.id,
      });

    if (!thread) {
      throw new Error("Não foi possível criar o tópico.");
    }

    await tx.insert(postTable).values(
      replies.map((reply, index) => {
        const createdAt = new Date(
          threadCreatedAt.getTime() + (index + 1) * 60_000,
        );

        return {
          threadId: thread.id,
          userId: reply.authorId,
          content: reply.content,
          createdAt,
          updatedAt: createdAt,
        };
      }),
    );
  });

  console.log(`✅ Tópico inserido em /forums/${forum.slug}.`);
  console.log(`🔗 Slug: ${THREAD_SLUG}`);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao inserir o tópico:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
