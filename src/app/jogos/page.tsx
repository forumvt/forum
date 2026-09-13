import { Gamepad2 } from "lucide-react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import * as gameEventService from "@/services/game-event.service";

export const metadata = {
  title: "Jogos | VT Forums",
  description: "Jogue, desbloqueie conquistas e dispute rankings.",
};

export default function JogosPage() {
  const games = gameEventService.listGamesCatalog();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/" as never}>Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Jogos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Gamepad2 className="text-primary size-7" />
          <h1 className="text-3xl font-bold tracking-tight">Jogos</h1>
        </div>
        <p className="text-muted-foreground text-base">
          Jogue, desbloqueie conquistas e dispute rankings.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <li
            key={game.slug}
            className="border-border bg-card flex flex-col gap-4 rounded-lg border p-5"
          >
            <div>
              <h2 className="text-xl font-semibold">
                <span className="mr-2" aria-hidden>
                  {game.icon}
                </span>
                {game.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {game.description}
              </p>
            </div>
            <Button asChild className="w-fit">
              <Link href={game.href as never}>Jogar</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
