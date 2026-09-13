import Link from "next/link";

import { DungeonSurvivorGame } from "@/components/games/dungeon-survivor/dungeon-survivor-game";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Dungeon Survivor | VT Forums",
  description: "Sobreviva às waves e desbloqueie conquistas.",
};

export default function DungeonSurvivorPage() {
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
            <BreadcrumbLink asChild>
              <Link href={"/jogos" as never}>Jogos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dungeon Survivor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="mr-2" aria-hidden>
            🏰
          </span>
          Dungeon Survivor
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Sobreviva às waves, colete moedas e desbloqueie conquistas.
        </p>
      </header>

      <DungeonSurvivorGame />
    </div>
  );
}
