import Link from "next/link";

import { cn } from "@/lib/utils";
import type { FilterType } from "@/types/filters";

const FILTERS: { value: FilterType; label: string; authOnly?: boolean }[] = [
  { value: "all", label: "Todos" },
  { value: "answered-by-me", label: "Respondidos por mim", authOnly: true },
  { value: "viewed-by-me", label: "Visualizadas por mim", authOnly: true },
  { value: "unanswered", label: "Sem respostas" },
];

interface ThreadFiltersProps {
  /** Filtro atualmente aplicado. */
  active: FilterType;
  /** Rota base da listagem, ex.: "/" ou "/forums/vale-tudo". */
  basePath: string;
  /** Exibe também os filtros que dependem de sessão. */
  showAuthFilters: boolean;
}

export function ThreadFilters({
  active,
  basePath,
  showAuthFilters,
}: ThreadFiltersProps) {
  const visible = FILTERS.filter((f) => showAuthFilters || !f.authOnly);

  return (
    <nav aria-label="Filtrar tópicos" className="mb-4 flex flex-wrap gap-2">
      {visible.map((filter) => {
        const isActive = active === filter.value;
        const href =
          filter.value === "all" ? basePath : `${basePath}?filter=${filter.value}`;

        return (
          <Link
            key={filter.value}
            href={href as never}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-border focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground hover:bg-muted",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
