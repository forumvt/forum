"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 2;

export function SearchForm({
  variant = "header",
  className,
}: {
  variant?: "header" | "page";
  className?: string;
}) {
  const searchParams = useSearchParams();
  const defaultQuery = searchParams.get("q") ?? "";
  const isPage = variant === "page";

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={cn("relative w-full", className)}
      key={defaultQuery}
    >
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Pesquisar..."
        className={cn("w-full pl-9", isPage && "h-11 pr-24 text-base")}
        aria-label="Pesquisar tópicos"
        minLength={MIN_LENGTH}
        required
        autoComplete="off"
        autoFocus={isPage}
      />
      {isPage && (
        <Button
          type="submit"
          size="sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
        >
          Buscar
        </Button>
      )}
    </form>
  );
}
