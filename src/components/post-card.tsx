"use client";

import { Loader2, MessageSquare, Pencil, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { BBCodeContent } from "@/components/bbcode-content";
import { BBCodeEditor } from "@/components/bbcode-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Post } from "@/types/post";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

function wasEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return (
    Number.isFinite(created) &&
    Number.isFinite(updated) &&
    updated - created > 1500
  );
}

function formatEditedAt(updatedAt: string): string {
  return new Date(updatedAt).toLocaleString("pt-BR");
}

function UserSidebar({ post }: { post: Post }) {
  return (
    <div className="border-border bg-muted w-48 shrink-0 border-r p-4">
      <div className="text-center">
        <Avatar className="border-border mx-auto mb-2 size-36 rounded-none border">
          <AvatarImage
            src={
              post.userAvatar ||
              `/placeholder.svg?height=64&width=64&query=${post.author}`
            }
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {post.author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-foreground font-semibold break-words">
          {post.author}
        </h3>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          <Badge variant="secondary">{post.title}</Badge>
          {post.isOriginalPoster && <Badge>OP</Badge>}
        </div>
      </div>
      <div className="text-muted-foreground mt-3 space-y-1 text-xs">
        <div>Membro desde: {post.joinDate}</div>
        <div>Posts: {post.posts}</div>
        <div>Likes: {post.likes}</div>
      </div>
    </div>
  );
}

function MobilePostHeader({ post }: { post: Post }) {
  return (
    <div className="border-border bg-muted border-b p-4">
      <div className="flex items-center gap-3">
        <Avatar className="border-border size-12 shrink-0 rounded-none border">
          <AvatarImage
            src={
              post.userAvatar ||
              `/placeholder.svg?height=48&width=48&query=${post.author}`
            }
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {post.author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-foreground font-semibold break-words">
              {post.author}
            </h3>
            <Badge variant="secondary">{post.title}</Badge>
            {post.isOriginalPoster && <Badge>OP</Badge>}
          </div>

          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-xs">
            <span>Posts: {post.posts}</span>
            <span>Likes: {post.likes}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm">{post.timestamp}</span>
      </div>
    </div>
  );
}

function PostActions({
  onReply,
  canEdit,
  onEdit,
}: {
  onReply: () => void;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <ThumbsUp />
        Curtir
      </Button>
      {canEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          <Pencil />
          Editar
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={onReply}
      >
        <MessageSquare />
        Responder
      </Button>
    </div>
  );
}

function EditedLabel({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  if (!wasEdited(createdAt, updatedAt)) return null;
  return (
    <p className="text-muted-foreground mt-3 text-xs italic">
      Editado em {formatEditedAt(updatedAt)}
    </p>
  );
}

export function PostCard({
  post,
  onReply,
  canEdit,
  threadSlug,
}: {
  post: Post;
  onReply: (user: string, content: string) => void;
  canEdit: boolean;
  threadSlug: string;
}) {
  const [content, setContent] = useState(post.content);
  const [updatedAt, setUpdatedAt] = useState(post.updatedAt);
  const [draft, setDraft] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(content);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(content);
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);

    const isOriginal = post.id.startsWith("thread-");
    const url = isOriginal
      ? `/api/threads/${threadSlug}`
      : `/api/posts/${post.id}`;
    const body = isOriginal
      ? { description: draft.trim() }
      : { content: draft.trim() };

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "Não foi possível salvar a edição");
        return;
      }

      const data = (await res.json()) as { updatedAt?: string };
      setContent(draft.trim());
      setUpdatedAt(data.updatedAt ?? new Date().toISOString());
      setEditing(false);
    } catch {
      setError("Não foi possível salvar a edição");
    } finally {
      setSaving(false);
    }
  }

  const body = editing ? (
    <div className="space-y-3">
      <BBCodeEditor
        id={`edit-post-${post.id}`}
        value={draft}
        onChange={setDraft}
        disabled={saving}
        minHeightClass="min-h-[160px]"
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={cancelEditing}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={saveEdit}
          disabled={saving || !draft.trim()}
          aria-busy={saving}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Pencil />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  ) : (
    <>
      <BBCodeContent content={content} />
      <EditedLabel createdAt={post.createdAt} updatedAt={updatedAt} />
    </>
  );

  return (
    <Card className="border-border overflow-hidden border bg-card">
      <div className="block md:hidden">
        <MobilePostHeader post={post} />
        <div className="p-4">{body}</div>
        {!editing && (
          <div className="border-border border-t px-4 py-3">
            <PostActions
              canEdit={canEdit}
              onEdit={startEditing}
              onReply={() => onReply(post.author, content)}
            />
          </div>
        )}
      </div>

      <div className="hidden md:flex">
        <UserSidebar post={post} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-border border-b px-4 py-2">
            <span className="text-muted-foreground text-sm">
              {post.timestamp}
            </span>
          </div>
          <div className="flex-1 p-4">{body}</div>
          {!editing && (
            <div className="border-border mt-auto border-t px-4 py-3">
              <PostActions
                canEdit={canEdit}
                onEdit={startEditing}
                onReply={() => onReply(post.author, content)}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
