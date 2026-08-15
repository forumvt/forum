import { eq, inArray } from "drizzle-orm";

import { db } from ".";
import { forumTable, postTable, threadTable, userTable } from "./schema";

const THREAD_SLUG = "ha-algo-estranho-acontecendo-com-os-sonhos";
const DEFAULT_FORUM_SLUG = "vale-tudo";

const authors = [
  {
    id: "dream-topic-watcher-17",
    name: "🍎 Watcher_17",
    email: "watcher-17@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-dream-walker",
    name: "🜂 DreamWalker",
    email: "dream-walker@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-signal-lost",
    name: "📡 SignalLost",
    email: "signal-lost@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-null-observer",
    name: "👁 NullObserver",
    email: "null-observer@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-archive-keeper",
    name: "📚 ArchiveKeeper",
    email: "archive-keeper@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-horizon",
    name: "🌌 Horizon",
    email: "horizon@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-lab-rat",
    name: "⚙ LabRat",
    email: "lab-rat@dream-topic.forumvt.local",
  },
  {
    id: "dream-topic-skeptic",
    name: "🔬 Skeptic",
    email: "skeptic@dream-topic.forumvt.local",
  },
] as const;

type AuthorId = (typeof authors)[number]["id"];

const replies: Array<{ authorId: AuthorId; content: string }> = [
  {
    authorId: "dream-topic-dream-walker",
    content:
      "Aconteceu comigo durante a pandemia.\n\nTrês amigos sonharam com o mesmo lugar, sem que um soubesse do sonho do outro.\n\nNunca conseguimos explicar.",
  },
  {
    authorId: "dream-topic-signal-lost",
    content:
      "[quote=🜂 DreamWalker]Três amigos sonharam com o mesmo lugar.[/quote]\n\nVocês comentaram os sonhos entre si antes?\n\nÀs vezes uma pequena informação influencia a memória dos outros.",
  },
  {
    authorId: "dream-topic-dream-walker",
    content:
      "Não.\n\nSó percebemos dias depois, durante um churrasco.\n\nFoi justamente isso que chamou atenção.",
  },
  {
    authorId: "dream-topic-null-observer",
    content:
      "Também já tive essa impressão.\n\nMas nosso cérebro é muito bom em encontrar padrões.\n\nQuando duas histórias coincidem, esquecemos todas as outras que foram completamente diferentes.",
  },
  {
    authorId: "dream-topic-watcher-17",
    content:
      "Foi exatamente isso que pensei.\n\nPor isso comecei a escrever tudo antes de conversar com qualquer pessoa.\n\nQueria evitar contaminar minha própria memória.",
  },
  {
    authorId: "dream-topic-archive-keeper",
    content:
      "Essa é uma boa prática.\n\nInclusive alguns pesquisadores recomendam registrar imediatamente ao acordar.\n\nSe você lembrar do sonho horas depois, ele já pode ter mudado bastante.",
  },
  {
    authorId: "dream-topic-horizon",
    content:
      "[quote=🍎 Watcher_17]Queria evitar contaminar minha própria memória.[/quote]\n\nEsse detalhe muda bastante a qualidade do relato.\n\nA maioria das pessoas reconstrói o sonho sem perceber.",
  },
  {
    authorId: "dream-topic-lab-rat",
    content:
      "Já tentou comparar datas?\n\nTipo:\n\nhorário que dormiu\nfase da lua\ntemperatura\nconsumo de cafeína\nmedicamentos\n\nÀs vezes existe uma variável comum.",
  },
  {
    authorId: "dream-topic-null-observer",
    content:
      "Boa ideia.\n\nOu simplesmente estresse.\n\nQuando muita gente passa pela mesma situação, é esperado que existam temas parecidos nos sonhos.",
  },
  {
    authorId: "dream-topic-dream-walker",
    content:
      "Mas aí entra outra pergunta.\n\nPor que justamente aquele lugar?\n\nNão era um shopping ou uma escola.\n\nEra um lugar muito específico que nenhum de nós conhecia.",
  },
  {
    authorId: "dream-topic-signal-lost",
    content:
      "Você consegue desenhar esse lugar?\n\nSeria interessante comparar com os desenhos das outras pessoas antes que conversem entre si.",
  },
  {
    authorId: "dream-topic-watcher-17",
    content:
      "Gostei dessa ideia.\n\nVou pedir para cada um desenhar separadamente e depois comparo.\n\nSe houver semelhanças reais, posto aqui.",
  },
  {
    authorId: "dream-topic-skeptic",
    content:
      "Só peço uma coisa.\n\nQuando publicar, poste também os desenhos que não se parecem.\n\nSenão acabamos olhando apenas as coincidências e ignorando todas as diferenças.",
  },
  {
    authorId: "dream-topic-horizon",
    content:
      "Concordo.\n\nÉ justamente isso que torna uma investigação interessante.\n\nNão é provar uma hipótese.\n\nÉ tentar derrubá-la.",
  },
];

async function findOrCreateForum(forumSlug: string) {
  const [existingForum] = await db
    .select({ id: forumTable.id, slug: forumTable.slug })
    .from(forumTable)
    .where(eq(forumTable.slug, forumSlug))
    .limit(1);

  if (existingForum) return existingForum;

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
    .returning({ id: forumTable.id, slug: forumTable.slug });

  if (!createdForum)
    throw new Error("Não foi possível criar o fórum Vale Tudo.");
  return createdForum;
}

async function main() {
  const forumSlug = process.argv[2] ?? DEFAULT_FORUM_SLUG;

  const [existingThread] = await db
    .select({ id: threadTable.id })
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
      .select({ id: userTable.id })
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
        title: "Há algo estranho acontecendo com os sonhos?",
        slug: THREAD_SLUG,
        description:
          "Nos últimos meses comecei a anotar meus sonhos.\n\nO estranho é que várias pessoas próximas relataram sonhos muito parecidos na mesma semana.\n\nNão estou dizendo que existe uma explicação sobrenatural, mas achei curioso.\n\nAlguém já passou por isso?",
        forumId: forum.id,
        userId: "dream-topic-watcher-17",
        createdAt: threadCreatedAt,
        updatedAt: now,
        lastPostAt: now,
        lastPostUserId: replies.at(-1)?.authorId,
      })
      .returning({ id: threadTable.id });

    if (!thread) throw new Error("Não foi possível criar o tópico.");

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
