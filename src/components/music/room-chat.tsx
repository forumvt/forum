"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MUSIC_CHAT_MAX_LENGTH, type MusicChatMessage } from "@/types/music";

export function RoomChat({
  messages,
  disabled,
  loading,
  onSend,
}: {
  messages: MusicChatMessage[];
  disabled?: boolean;
  loading?: boolean;
  onSend: (message: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    const ok = await onSend(value);
    if (ok) setText("");
  }

  return (
    <section className="flex h-full min-h-[220px] flex-col">
      <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
        Chat
      </h2>

      <div className="bg-muted/20 mb-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto rounded-lg border p-3">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhuma mensagem ainda. Seja o primeiro a falar.
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <Avatar className="mt-0.5 size-6 shrink-0">
                <AvatarImage src={msg.avatar ?? undefined} alt="" />
                <AvatarFallback>{msg.username.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold">{msg.username}</span>
                  <time className="text-muted-foreground text-[11px]">
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MUSIC_CHAT_MAX_LENGTH))}
          disabled={disabled || loading}
          placeholder="Digite uma mensagem…"
          maxLength={MUSIC_CHAT_MAX_LENGTH}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || loading || !text.trim()}>
          Enviar
        </Button>
      </form>
    </section>
  );
}
