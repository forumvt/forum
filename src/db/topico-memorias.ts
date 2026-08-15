import { eq, inArray } from "drizzle-orm";

import { db } from ".";
import { forumTable, postTable, threadTable, userTable } from "./schema";

const THREAD_SLUG = "se-uma-copia-tivesse-suas-memorias-ela-seria-voce";
const DEFAULT_FORUM_SLUG = "vale-tudo";

const authors = [
  {
    id: "memory-copy-topic-lucid-witness",
    name: "LucidWitness",
    email: "lucid-witness@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/lucid-witness.webp",
  },
  {
    id: "memory-copy-topic-memory-probe",
    name: "MemoryProbe",
    email: "memory-probe@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/memory-probe.webp",
  },
  {
    id: "memory-copy-topic-deep-signal",
    name: "DeepSignal",
    email: "deep-signal@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/deep-signal.webp",
  },
  {
    id: "memory-copy-topic-frame-by-frame",
    name: "FrameByFrame",
    email: "frame-by-frame@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/frame-by-frame.webp",
  },
  {
    id: "memory-copy-topic-control-group",
    name: "ControlGroup",
    email: "control-group@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/control-group.webp",
  },
  {
    id: "memory-copy-topic-old-archive",
    name: "OldArchive",
    email: "old-archive@memory-copy-topic.forumvt.local",
    image: "/avatars/memory-copies/old-archive.webp",
  },
] as const;

type AuthorId = (typeof authors)[number]["id"];

const replies: Array<{ authorId: AuthorId; content: string }> = [
  {
    authorId: "memory-copy-topic-memory-probe",
    content:
      "A pergunta depende do que você chama de ‘você’.\n\nSe identidade for apenas memória e personalidade, a cópia teria motivos para acreditar que é a continuação original.\n\nMas duas consciências poderiam reivindicar a mesma história a partir do instante da duplicação.",
  },
  {
    authorId: "memory-copy-topic-deep-signal",
    content:
      "Já tive falsos despertares em que eu estava numa sala metálica e ouvia pessoas conversando atrás de um vidro.\n\nNa hora parecia mais real do que um sonho comum.\n\nDepois de acordar de verdade, a sensação de ter estado em outro corpo demorou horas para passar.",
  },
  {
    authorId: "memory-copy-topic-control-group",
    content:
      "[quote=DeepSignal]Na hora parecia mais real do que um sonho comum.[/quote]\n\nA intensidade da experiência não mede sua origem.\n\nFalso despertar, paralisia do sono e sonho lúcido podem produzir cenários coerentes, presença de outras pessoas e até sensações corporais muito convincentes.",
  },
  {
    authorId: "memory-copy-topic-frame-by-frame",
    content:
      "O detalhe importante seria registrar o cenário antes de ler outros relatos.\n\nPlanta da sala, posição das portas, iluminação, ruídos e sequência dos acontecimentos.\n\nSem isso, imagens vistas depois podem entrar na lembrança original sem que a pessoa perceba.",
  },
  {
    authorId: "memory-copy-topic-lucid-witness",
    content:
      "Comecei justamente por aí.\n\nDeixei um caderno ao lado da cama e escrevi tudo imediatamente ao acordar.\n\nTambém marquei quais detalhes eu lembrava com certeza e quais eram apenas impressões.",
  },
  {
    authorId: "memory-copy-topic-old-archive",
    content:
      "Esse debate é mais antigo do que a tecnologia sugerida por esses relatos.\n\nO paradoxo do teletransporte pergunta a mesma coisa: se uma máquina reconstruir seu corpo e suas memórias em outro lugar, houve transporte ou morte seguida de cópia?\n\nNão precisamos aceitar a máquina como real para a pergunta filosófica ser interessante.",
  },
  {
    authorId: "memory-copy-topic-deep-signal",
    content:
      "Existe um som que se repete nos meus episódios.\n\nSão três pulsos graves, uma pausa e depois um tom contínuo.\n\nNunca encontrei esse padrão fora do sonho, mas consigo reproduzi-lo de memória.",
  },
  {
    authorId: "memory-copy-topic-memory-probe",
    content:
      "Grave o padrão agora, antes de procurar por sons parecidos.\n\nA memória não funciona como um arquivo de áudio; cada lembrança é também uma reconstrução.\n\nSe você encontrar depois uma gravação semelhante, poderá comparar com o registro feito hoje.",
  },
  {
    authorId: "memory-copy-topic-control-group",
    content:
      "Também tentaria fazer previsões.\n\nSe o lugar existe independentemente do sonho, algum detalhe ainda desconhecido deveria aparecer primeiro no diário e ser confirmado depois por uma fonte externa.\n\nSem previsão registrada, qualquer semelhança pode ser escolhida retrospectivamente.",
  },
  {
    authorId: "memory-copy-topic-frame-by-frame",
    content:
      "Pedi para três pessoas desenharem separadamente o tipo de sala que imaginaram ao ler apenas a frase ‘acordei em uma cópia do meu corpo’.\n\nAs três desenharam uma mesa central e luzes no teto.\n\nMas portas, equipamentos e proporções eram completamente diferentes.",
  },
  {
    authorId: "memory-copy-topic-lucid-witness",
    content:
      "Isso mostra como uma descrição curta já direciona a imagem mental.\n\n‘Sala’, ‘cópia’ e ‘acordar’ provavelmente puxam referências de filmes, laboratórios e hospitais.\n\nTalvez parte das coincidências venha desse repertório cultural compartilhado.",
  },
  {
    authorId: "memory-copy-topic-old-archive",
    content:
      "[quote=LucidWitness]Talvez parte das coincidências venha desse repertório cultural compartilhado.[/quote]\n\nE por isso os desenhos diferentes são tão importantes quanto os parecidos.\n\nUma investigação honesta preserva o conjunto completo, inclusive aquilo que enfraquece a hipótese favorita.",
  },
  {
    authorId: "memory-copy-topic-deep-signal",
    content:
      "Mesmo que a explicação seja psicológica, a pergunta sobre identidade continua me incomodando.\n\nSe uma cópia lembrasse da minha infância, dos meus medos e deste exato tópico, ela não se sentiria falsa.\n\nPara ela, eu é que pareceria a cópia.",
  },
  {
    authorId: "memory-copy-topic-control-group",
    content:
      "Concordo com a pergunta filosófica, mas separaria as camadas.\n\nUma ideia pode ser fascinante sem que o relato literal esteja demonstrado.\n\nMisturar possibilidade lógica com evidência concreta é o ponto em que muitas discussões deixam de avançar.",
  },
  {
    authorId: "memory-copy-topic-lucid-witness",
    content:
      "Vou continuar registrando os episódios sem assumir que sejam lembranças externas.\n\nSe surgir um detalhe verificável, publico o registro original com data.\n\nSe não surgir, ainda teremos um bom mapa de como sonhos, expectativas e histórias compartilhadas constroem uma realidade convincente.",
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
    for (const author of authors) {
      await tx
        .insert(userTable)
        .values({
          ...author,
          emailVerified: false,
          role: "USER",
          createdAt: threadCreatedAt,
          updatedAt: threadCreatedAt,
        })
        .onConflictDoUpdate({
          target: userTable.email,
          set: {
            name: author.name,
            image: author.image,
            updatedAt: now,
          },
        });
    }

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
        title: "Se uma cópia tivesse suas memórias, ela seria você?",
        slug: THREAD_SLUG,
        description:
          "Li recentemente relatos de pessoas que afirmam acordar em ambientes desconhecidos, cercadas por rostos familiares, como se a consciência tivesse sido transferida para uma cópia do próprio corpo.\n\nNão encontrei evidência verificável de que isso aconteça literalmente, mas a ideia levanta uma pergunta interessante.\n\nSe uma cópia perfeita tivesse suas lembranças, sua personalidade e a certeza de ser você, qual dos dois seria o original?\n\nE como separar uma experiência real de sonho lúcido, falso despertar ou memória reconstruída?",
        forumId: forum.id,
        userId: "memory-copy-topic-lucid-witness",
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
