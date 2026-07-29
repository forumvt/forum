import { Crown, MessageSquare, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ForumsListSkeleton } from "@/components/forums-list-skeleton";
import { RightRail } from "@/components/right-rail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";

/** Evita pré-render estático no build sem acesso ao Postgres (ex.: CI sem DATABASE_URL). */
export const dynamic = "force-dynamic";

const categories: {
  value: "GAMING" | "POLITICA" | "VALE_TUDO";
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}[] = [
  {
    value: "GAMING",
    label: "Gaming",
    icon: <Zap className="h-5 w-5" />,
    color: "bg-gradient-to-r from-blue-500 to-indigo-500",
    description: "Discussões sobre jogos e entretenimento",
  },
  {
    value: "POLITICA",
    label: "Política",
    icon: <Crown className="h-5 w-5" />,
    color: "bg-gradient-to-r from-slate-600 to-gray-700",
    description: "Debates e discussões políticas",
  },
  {
    value: "VALE_TUDO",
    label: "Vale Tudo",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-gradient-to-r from-green-600 to-emerald-600",
    description: "Discussões gerais sobre diversos temas",
  },
];

async function ForumsListContent() {
  const forums = await db.query.forumTable.findMany({});

  const grouped = categories.map((cat) => ({
    ...cat,
    forums: forums.filter((f) => f.category === cat.value),
  }));

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Conteúdo principal */}
      <div className="min-w-0 flex-1 space-y-8">
        {grouped.map(
          (cat) =>
            cat.forums.length > 0 && (
              <div key={cat.value} className="space-y-4">
                {/* Category Header */}
                <div
                  className={`${cat.color} rounded-lg p-4 text-white shadow-lg`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {cat.icon}
                    <h3 className="text-xl font-bold">{cat.label}</h3>
                    <Badge className="border-white/30 bg-white/20 text-white">
                      {cat.forums.length} Fóruns
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm opacity-90">{cat.description}</p>
                </div>

                {/* Forums */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cat.forums.map((forum) => (
                    <Card
                      key={forum.id}
                      className="group border-border hover:border-primary/40 h-full transition-all duration-300 hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="group-hover:text-primary text-lg font-bold break-words transition-colors">
                            <Link
                              className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-[3px]"
                              href={`/forums/${forum.slug}`}
                            >
                              {forum.title}
                            </Link>
                          </h4>
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {forum.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ),
        )}
      </div>

      {/* Barra lateral */}
      <aside className="w-full shrink-0 lg:w-80">
        <RightRail />
      </aside>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="chaos-heading mb-2 text-3xl font-bold md:text-4xl">
          VT Forums
        </h1>
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao nosso fórum de discussão
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <h2 className="text-foreground mb-4 text-2xl font-bold">
          Fóruns de Discussão
        </h2>
        <p className="text-muted-foreground mb-6">
          Participe de discussões sobre diversos temas. Mantenha o respeito e
          contribua com conteúdo de qualidade.
        </p>
      </div>

      <Suspense fallback={<ForumsListSkeleton />}>
        <ForumsListContent />
      </Suspense>
    </main>
  );
}
