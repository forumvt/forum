"use client";

import { MessageSquare, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Post } from "@/types/post";
import { parseBBCode } from "@/utils/bbcode-parser";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface BBCodeElement {
  type: string;
  content: string;
  data?: {
    url?: string;
    id?: string;
    username?: string;
  };
}

// Componente para renderizar conteúdo BBCode
function BBCodeContent({ content }: { content: string }) {
  const elements = parseBBCode(content) as BBCodeElement[];

  const renderElement = (element: BBCodeElement, index: number) => {
    switch (element.type) {
      case "text":
        return (
          <div
            key={index}
            className="prose prose-sm dark:prose-invert max-w-none"
          >
            <p className="text-foreground break-words whitespace-pre-wrap">
              {element.content}
            </p>
          </div>
        );

      case "image":
        return (
          <div
            key={index}
            className="border-border overflow-hidden rounded-lg border shadow-md"
          >
            <img
              src={element.data?.url || "/placeholder.svg"}
              alt={`Imagem ${index + 1}`}
              className="h-auto w-full object-contain"
            />
          </div>
        );

      case "youtube":
        return (
          <div
            key={index}
            className="border-border aspect-video overflow-hidden rounded-lg border shadow-md"
          >
            <iframe
              src={`https://www.youtube.com/embed/${element.data?.id}`}
              title={`Vídeo ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        );

      case "twitter":
        return (
          <div
            key={index}
            className="border-border bg-muted rounded-lg border p-4 shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="bg-foreground flex h-4 w-4 items-center justify-center rounded-sm">
                <span className="text-background text-xs font-bold">𝕏</span>
              </div>
              <span className="text-muted-foreground text-sm">
                Tweet incorporado
              </span>
            </div>
            <a
              href={
                element.content.startsWith("http")
                  ? element.content
                  : `https://twitter.com/i/status/${element.data?.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              Ver tweet original →
            </a>
          </div>
        );

      case "quote":
        return (
          <div
            key={index}
            className="border-border my-4 overflow-hidden rounded-md border bg-muted/50"
          >
            <div className="bg-accent text-accent-foreground px-4 py-1.5 font-bold">
              {element.data?.username ? `${element.data.username}:` : "Quote:"}
            </div>
            <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none p-4 pt-2 break-words">
              {element.content}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-w-0 space-y-4">{elements.map(renderElement)}</div>
  );
}

// Componente para User Info Sidebar (Desktop)
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

// Componente para Header Mobile
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
        <Badge variant="outline" className="text-muted-foreground">
          Mensagem
        </Badge>
      </div>
    </div>
  );
}

// Componente para ações do post
function PostActions({ onReply }: { onReply: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <ThumbsUp />
        Curtir
      </Button>
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

export function PostCard({
  post,
  onReply,
}: {
  post: Post;
  onReply: (user: string, content: string) => void;
}) {
  return (
    <Card className="border-border overflow-hidden border bg-card">
      {/* MOBILE */}
      <div className="block md:hidden">
        <MobilePostHeader post={post} />
        <div className="p-4">
          <BBCodeContent content={post.content} />
        </div>
        <div className="px-4 pb-4">
          <PostActions onReply={() => onReply(post.author, post.content)} />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex">
        <UserSidebar post={post} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="p-4">
            <BBCodeContent content={post.content} />
          </div>
          <div className="bg-muted mt-auto px-4 py-3">
            <PostActions onReply={() => onReply(post.author, post.content)} />
          </div>
        </div>
      </div>
    </Card>
  );
}