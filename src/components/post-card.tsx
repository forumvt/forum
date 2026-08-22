"use client";

import { Loader2, MessageSquare, Pencil, ThumbsUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BBCodeContent } from "@/components/bbcode-content";
import { BBCodeEditor } from "@/components/bbcode-editor";
import { ChangeAuthorSheet } from "@/components/change-author-sheet";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatarLink, UserNameLink } from "@/components/user-link";
import { DELETED_POST_NOTICE } from "@/lib/moderation-copy";
import type { Post } from "@/types/post";

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

function UserSidebar({
  post,
  changeAuthor,
}: {
  post: Post;
  changeAuthor?: { saveUrl: string };
}) {
  return (
    <div className="border-border bg-muted w-48 shrink-0 border-r p-4">
      <div className="text-center">
        <UserAvatarLink
          userId={post.userId}
          name={post.author}
          avatar={post.userAvatar}
          className="mx-auto mb-2 size-36"
        />
        <h3 className="text-foreground font-semibold break-words">
          <UserNameLink userId={post.userId} name={post.author} />
        </h3>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          <Badge variant="secondary">{post.title}</Badge>
          {post.isOriginalPoster && <Badge>OP</Badge>}
        </div>
        {changeAuthor ? (
          <div className="mt-3">
            <ChangeAuthorSheet
              currentUserId={post.userId}
              currentUserName={post.author}
              saveUrl={changeAuthor.saveUrl}
            />
          </div>
        ) : null}
      </div>
      <div className="text-muted-foreground mt-3 space-y-1 text-xs">
        <div>Membro desde: {post.joinDate}</div>
        <div>Posts: {post.posts}</div>
        <div>Likes: {post.likes}</div>
      </div>
    </div>
  );
}

function MobilePostHeader({
  post,
  changeAuthor,
}: {
  post: Post;
  changeAuthor?: { saveUrl: string };
}) {
  return (
    <div className="border-border bg-muted border-b p-4">
      <div className="flex items-center gap-3">
        <UserAvatarLink
          userId={post.userId}
          name={post.author}
          avatar={post.userAvatar}
          className="size-12"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-foreground font-semibold break-words">
              <UserNameLink userId={post.userId} name={post.author} />
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
      {changeAuthor ? (
        <div className="mt-3">
          <ChangeAuthorSheet
            currentUserId={post.userId}
            currentUserName={post.author}
            saveUrl={changeAuthor.saveUrl}
          />
        </div>
      ) : null}
    </div>
  );
}

function PostActions({
  onReply,
  canEdit,
  onEdit,
  canDelete,
  onDelete,
  deleting,
  canReport,
  reportTargetType,
  reportTargetId,
  likeCount,
  likedByMe,
  liking,
  onLike,
}: {
  onReply: () => void;
  canEdit: boolean;
  onEdit: () => void;
  canDelete: boolean;
  onDelete: () => void;
  deleting: boolean;
  canReport: boolean;
  reportTargetType: "post" | "thread";
  reportTargetId: string;
  likeCount: number;
  likedByMe: boolean;
  liking: boolean;
  onLike: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          likedByMe
            ? "text-primary hover:text-primary"
            : "text-muted-foreground hover:text-foreground"
        }
        onClick={onLike}
        disabled={liking}
        aria-pressed={likedByMe}
      >
        <ThumbsUp />
        Curtir{likeCount > 0 ? ` ${likeCount}` : ""}
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
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 />
          Excluir
        </Button>
      )}
      {canReport && (
        <ReportButton targetType={reportTargetType} targetId={reportTargetId} />
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
  canDelete,
  canReport,
  canModerate,
  canChangeAuthor,
  threadId,
  threadSlug,
}: {
  post: Post;
  onReply: (user: string, content: string, userId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
  canModerate: boolean;
  canChangeAuthor?: boolean;
  threadId: string;
  threadSlug: string;
}) {
  const [content, setContent] = useState(post.content);
  const [updatedAt, setUpdatedAt] = useState(post.updatedAt);
  const [draft, setDraft] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [liking, setLiking] = useState(false);
  const [deleted, setDeleted] = useState(Boolean(post.isDeleted));
  const [deleting, setDeleting] = useState(false);
  const isOriginal = post.id.startsWith("thread-");
  const changeAuthor = canChangeAuthor
    ? {
        saveUrl: isOriginal
          ? `/api/threads/${encodeURIComponent(threadSlug)}/author`
          : `/api/posts/${encodeURIComponent(post.id)}/author`,
      }
    : undefined;

  async function toggleLike() {
    if (liking) return;
    setLiking(true);
    const previousCount = likeCount;
    const previousLiked = likedByMe;
    setLikedByMe(!previousLiked);
    setLikeCount(previousCount + (previousLiked ? -1 : 1));

    const isOriginal = post.id.startsWith("thread-");
    const url = isOriginal
      ? `/api/threads/${threadSlug}/like`
      : `/api/posts/${post.id}/like`;

    try {
      const res = await fetch(url, { method: "POST" });
      if (res.status === 401) {
        setLikedByMe(previousLiked);
        setLikeCount(previousCount);
        toast.error("Faça login para curtir.");
        return;
      }
      if (!res.ok) {
        setLikedByMe(previousLiked);
        setLikeCount(previousCount);
        toast.error("Não foi possível curtir.");
        return;
      }
      const data = (await res.json()) as { liked: boolean };
      setLikedByMe(data.liked);
      setLikeCount(
        previousCount +
          (data.liked ? (previousLiked ? 0 : 1) : previousLiked ? -1 : 0),
      );
    } catch {
      setLikedByMe(previousLiked);
      setLikeCount(previousCount);
      toast.error("Não foi possível curtir.");
    } finally {
      setLiking(false);
    }
  }

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

  async function removePost() {
    if (deleting) return;
    const label = isOriginal
      ? "Excluir este tópico?"
      : "Excluir esta resposta?";
    if (!window.confirm(label)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        isOriginal
          ? `/api/threads/${encodeURIComponent(threadSlug)}/moderate`
          : `/api/posts/${post.id}`,
        {
          method: isOriginal ? "PATCH" : "DELETE",
          headers: isOriginal
            ? { "Content-Type": "application/json" }
            : undefined,
          body: isOriginal ? JSON.stringify({ action: "delete" }) : undefined,
        },
      );
      if (!res.ok) {
        toast.error("Não foi possível excluir.");
        return;
      }
      setDeleted(true);
      toast.success(isOriginal ? "Tópico excluído." : "Resposta excluída.");
      if (isOriginal) {
        window.location.href = "/";
      }
    } catch {
      toast.error("Não foi possível excluir.");
    } finally {
      setDeleting(false);
    }
  }

  async function restoreDeleted() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error("Não foi possível restaurar.");
        return;
      }
      setDeleted(false);
      toast.success("Resposta restaurada.");
    } catch {
      toast.error("Não foi possível restaurar.");
    } finally {
      setDeleting(false);
    }
  }

  const actions = (
    <PostActions
      canEdit={canEdit && !deleted}
      onEdit={startEditing}
      canDelete={canDelete && !deleted}
      onDelete={() => void removePost()}
      deleting={deleting}
      canReport={canReport && !deleted}
      reportTargetType={isOriginal ? "thread" : "post"}
      reportTargetId={isOriginal ? threadId : post.id}
      onReply={() => onReply(post.author, content, post.userId)}
      likeCount={likeCount}
      likedByMe={likedByMe}
      liking={liking}
      onLike={() => void toggleLike()}
    />
  );

  const body = deleted ? (
    <div className="space-y-3">
      <p className="text-muted-foreground italic">{DELETED_POST_NOTICE}</p>
      {canModerate ? (
        <>
          <div className="border-border bg-muted/40 rounded-md border p-3">
            <BBCodeContent content={content} />
          </div>
          {!isOriginal ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deleting}
              onClick={() => void restoreDeleted()}
            >
              Restaurar
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  ) : editing ? (
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
        <MobilePostHeader post={post} changeAuthor={changeAuthor} />
        <div className="p-4">{body}</div>
        {!editing && (
          <div className="border-border border-t px-4 py-3">{actions}</div>
        )}
      </div>

      <div className="hidden md:flex">
        <UserSidebar post={post} changeAuthor={changeAuthor} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-border border-b px-4 py-2">
            <span className="text-muted-foreground text-sm">
              {post.timestamp}
            </span>
          </div>
          <div className="flex-1 p-4">{body}</div>
          {!editing && (
            <div className="border-border mt-auto border-t px-4 py-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
