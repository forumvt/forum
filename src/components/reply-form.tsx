"use client";

import { Loader2, MessageSquare, Send } from "lucide-react";
import type React from "react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { BBCodeEditor } from "@/components/bbcode-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { LoginDialog } from "./login-dialog";
import { RegisterDialog } from "./register-dialog";

export interface ReplyFormHandle {
  replyTo: (username: string, content: string, userId: string) => void;
}

interface ReplyFormProps {
  threadId: string;
  userId?: string;
  isAuthenticated: boolean;
  forum: string;
}

export const ReplyForm = forwardRef<ReplyFormHandle, ReplyFormProps>(
  ({ threadId, userId, isAuthenticated, forum }, ref) => {
    const [content, setContent] = useState("");
    const [quotedUserId, setQuotedUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const editorWrapRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      replyTo(username: string, postContent: string, quotedId: string) {
        const quoted = `[quote=${username}]${postContent}[/quote]\n\n`;
        setContent(quoted);
        setQuotedUserId(quotedId);

        setTimeout(() => {
          editorWrapRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          editorWrapRef.current?.querySelector("textarea")?.focus();
        }, 50);
      },
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;

      setIsSubmitting(true);

      try {
        const res = await fetch(`/api/threads/${forum}/add-reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            threadId,
            userId,
            quotedUserId,
          }),
        });

        if (res.ok) {
          setContent("");
          setQuotedUserId(null);
          window.location.reload();
        } else {
          const data = await res.json();
          alert("Error: " + (data.error || "Failed to create post"));
        }
      } catch {
        alert("Error: Failed to create post");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isAuthenticated) {
      return (
        <Card className="border-border bg-muted/50 p-6 text-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <MessageSquare className="text-muted-foreground size-8" />
            <h3 className="text-foreground text-lg font-semibold">
              Participe da Discussão!
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Você precisa fazer login ou se registrar para responder a este
            tópico.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <LoginDialog />
            <RegisterDialog />
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-border bg-card w-full border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-foreground text-lg font-bold">
              Criar Resposta
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="post-content" className="mb-2">
              Conteúdo
            </Label>
            <div ref={editorWrapRef}>
              <BBCodeEditor
                id="post-content"
                value={content}
                onChange={setContent}
                disabled={isSubmitting}
                placeholder="Escreva sua resposta aqui... Use BBCode para formatar o texto, imagens, vídeos e citações."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              aria-busy={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Send />
              )}
              {isSubmitting ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
);

ReplyForm.displayName = "ReplyForm";
