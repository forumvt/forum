"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ForumListItem } from "@/types/forum";

function scrollToCreatedThread(threadId: string) {
  const elId = `topico-${threadId}`;
  const deadline = Date.now() + 4000;

  function tryScroll() {
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el
        .querySelector<HTMLAnchorElement>('a[href^="/threads/"]')
        ?.focus({ preventScroll: true });
      return;
    }
    if (Date.now() < deadline) {
      requestAnimationFrame(tryScroll);
      return;
    }
    document.getElementById("lista-topicos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  requestAnimationFrame(tryScroll);
}

export function CreateThread({ forums }: { forums: ForumListItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const payload = {
      forumId: formData.get("forumId"),
      title: formData.get("title"),
      description: formData.get("content"),
    };

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return;
    }

    const created = (await res.json()) as { id?: string };
    toast.success("Tópico criado com sucesso!");

    if (titleRef.current) titleRef.current.value = "";
    if (contentRef.current) contentRef.current.value = "";

    router.refresh();

    if (created.id) {
      scrollToCreatedThread(created.id);
    } else {
      requestAnimationFrame(() => {
        document.getElementById("lista-topicos")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }
  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 font-medium shadow-lg sm:px-6 sm:py-3"
        size="lg"
      >
        <PlusIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Criar Tópico</span>
      </Button>

      {open && (
        <Card className="mt-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fórum */}
            <div>
              <label className="mb-1 block text-sm font-medium">Fórum</label>
              <select
                name="forumId"
                className="w-full rounded border p-2"
                required
              >
                <option value="">Selecione um fórum</option>
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Título do tópico
              </label>
              <input
                ref={titleRef}
                type="text"
                name="title"
                className="w-full rounded border p-2"
                required
              />
            </div>

            {/* Texto */}
            <div>
              <label className="mb-1 block text-sm font-medium">Conteúdo</label>
              <textarea
                ref={contentRef}
                name="content"
                rows={5}
                className="w-full rounded border p-2"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Publicar</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
