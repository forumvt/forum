"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { BBCodeEditor } from "@/components/bbcode-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ForumListItem } from "@/types/forum";

function scrollToCreatedThread(threadId: string) {
  const elId = `topico-${threadId}`;
  const deadline = Date.now() + 4000;

  function tryScroll() {
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.querySelector<HTMLAnchorElement>('a[href^="/threads/"]')?.focus({
        preventScroll: true,
      });
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
  const [content, setContent] = useState("");
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData(e.currentTarget);

    const payload = {
      forumId: formData.get("forumId"),
      title: formData.get("title"),
      description: content.trim(),
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
    setContent("");

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
        size="lg"
        className="w-full font-medium shadow-lg sm:w-auto"
        aria-expanded={open}
        aria-controls="form-criar-topico"
      >
        <PlusIcon className="size-4 sm:size-5" />
        <span className="text-sm sm:text-base">Criar Tópico</span>
      </Button>

      {open && (
        <Card id="form-criar-topico" className="mt-6 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novo-topico-forum">Fórum</Label>
              <select
                id="novo-topico-forum"
                name="forumId"
                required
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">Selecione um fórum</option>
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-topico-titulo">Título do tópico</Label>
              <Input
                ref={titleRef}
                id="novo-topico-titulo"
                type="text"
                name="title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novo-topico-conteudo">Conteúdo</Label>
              <BBCodeEditor
                id="novo-topico-conteudo"
                value={content}
                onChange={setContent}
                minHeightClass="min-h-32"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!content.trim()}>
                Publicar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
