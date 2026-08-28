"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { displayUserName, userInitials } from "@/lib/utils";
import { PM_MAX_PARTICIPANTS, type PmPerson } from "@/types/pm";

export function PmPeoplePicker({
  selected,
  onChange,
  excludeIds = [],
}: {
  selected: PmPerson[];
  onChange: (people: PmPerson[]) => void;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<PmPerson[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ q: debounced });
    for (const id of [...excludeIds, ...selected.map((person) => person.id)]) {
      params.append("exclude", id);
    }
    void fetch(`/api/users/search?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("fail");
        return (await res.json()) as { people?: PmPerson[] };
      })
      .then((data) => {
        setResults(data.people ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
      });
    return () => controller.abort();
  }, [debounced, excludeIds, selected]);

  const atLimit = selected.length >= PM_MAX_PARTICIPANTS - 1;

  function add(person: PmPerson) {
    if (atLimit) return;
    if (selected.some((item) => item.id === person.id)) return;
    onChange([...selected, person]);
    setQuery("");
    setResults([]);
  }

  function remove(id: string) {
    onChange(selected.filter((person) => person.id !== id));
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((person) => {
            const name = displayUserName(person.name);
            return (
              <span
                key={person.id}
                className="border-border bg-muted inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-1.5 text-sm"
              >
                <Avatar className="size-5">
                  <AvatarImage src={person.avatar || undefined} alt="" />
                  <AvatarFallback className="text-[9px]">
                    {userInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">{name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
                  onClick={() => remove(person.id)}
                  aria-label={`Remover ${name}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={
          atLimit
            ? "Limite de participantes atingido"
            : "Buscar pessoas para adicionar…"
        }
        disabled={atLimit}
      />

      {debounced.length >= 2 ? (
        <div className="border-border rounded-md border">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">
              Ninguém encontrado.
            </p>
          ) : (
            results.map((person) => {
              const name = displayUserName(person.name);
              return (
                <Button
                  key={person.id}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2"
                  onClick={() => add(person)}
                >
                  <Avatar className="size-8">
                    <AvatarImage src={person.avatar || undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {userInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{name}</span>
                </Button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
