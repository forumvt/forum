"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { SubButton } from "@/components/sub-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { userProfilePath } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import { patchUserPreview, userPreviewCache } from "@/lib/user-preview-cache";
import {
  cn,
  displayUserName,
  formatJoinedOn,
  userInitials,
} from "@/lib/utils";
import type { UserPreview } from "@/types/user";
const OPEN_DELAY_MS = 280;
const CLOSE_DELAY_MS = 160;
const CARD_WIDTH = 320;
const emptySubscribe = () => () => {};

export type UserHoverSide = "right" | "top";

function placeCard(
  trigger: DOMRect,
  card: { width: number; height: number },
  side: UserHoverSide,
): { top: number; left: number } {
  const gap = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = card.width || CARD_WIDTH;
  const height = card.height || 220;

  let left = side === "right" ? trigger.right + gap : trigger.left;
  let top = side === "right" ? trigger.top : trigger.top - height - gap;

  if (left + width > vw - gap) {
    left = side === "right" ? trigger.left - width - gap : vw - width - gap;
  }
  if (left < gap) left = gap;

  if (top + height > vh - gap) {
    top = Math.max(gap, vh - height - gap);
  }
  if (top < gap) {
    top = side === "top" ? trigger.bottom + gap : gap;
  }

  return { top, left };
}

function comingSoon(action: string, loggedIn: boolean) {
  if (!loggedIn) {
    toast.error("Faça login para continuar.");
    return;
  }
  toast.message("Em breve", {
    description: `${action} ainda não está disponível.`,
  });
}

function positionCard(
  triggerEl: HTMLElement | null,
  cardEl: HTMLDivElement | null,
  side: UserHoverSide,
) {
  if (!triggerEl || !cardEl) return;
  const { top, left } = placeCard(
    triggerEl.getBoundingClientRect(),
    { width: cardEl.offsetWidth, height: cardEl.offsetHeight },
    side,
  );
  cardEl.style.top = `${top}px`;
  cardEl.style.left = `${left}px`;
  cardEl.style.visibility = "visible";
}

export function UserHoverCard({
  userId,
  side = "right",
  children,
}: {
  userId: string;
  side?: UserHoverSide;
  children: React.ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number>(0);
  const closeTimer = useRef<number>(0);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<UserPreview | null>(
    () => userPreviewCache.get(userId) ?? null,
  );
  const [loading, setLoading] = useState(() => !userPreviewCache.has(userId));

  const scheduleOpen = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    openTimer.current = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }, []);

  const scheduleClose = useCallback(() => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(
      () => setOpen(false),
      CLOSE_DELAY_MS,
    );
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(openTimer.current);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (userPreviewCache.has(userId)) return;

    let cancelled = false;
    void fetch(`/api/users/${encodeURIComponent(userId)}/preview`)
      .then(async (res) => {
        if (!res.ok) throw new Error("preview failed");
        return (await res.json()) as UserPreview;
      })
      .then((data) => {
        if (cancelled) return;
        userPreviewCache.set(userId, data);
        setPreview(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPreview(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  useLayoutEffect(() => {
    if (!open) return;
    positionCard(triggerRef.current, cardRef.current, side);
  }, [open, preview, loading, side]);

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const isOwnProfile = session?.user?.id === userId;
  const loggedIn = Boolean(session?.user);
  const name = displayUserName(preview?.name);

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      {children}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={cardRef}
            role="dialog"
            aria-label={preview ? `Perfil de ${name}` : "Prévia do perfil"}
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
            style={{ width: CARD_WIDTH, visibility: "hidden" }}
            className="border-border bg-popover text-popover-foreground fixed z-50 rounded-md border shadow-lg"
          >
            {loading && !preview ? (
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="bg-muted size-16 shrink-0 animate-pulse rounded-none" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-5 w-32 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-28 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ) : preview ? (
              <>
                <div className="flex gap-3 p-3">
                  <Link
                    href={userProfilePath(preview.id) as never}
                    className="focus-visible:ring-ring shrink-0 outline-none focus-visible:ring-[3px]"
                  >
                    <Avatar className="border-border size-16 rounded-none border">
                      <AvatarImage
                        src={preview.avatar || "/placeholder.svg"}
                        alt={name}
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {userInitials(preview.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 pt-0.5">
                    <Link
                      href={userProfilePath(preview.id) as never}
                      className="text-foreground hover:text-primary block truncate text-base font-bold underline-offset-2 hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {preview.roleLabel}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Entrou em {formatJoinedOn(preview.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="border-border grid grid-cols-3 border-y">
                  <Stat label="Posts" value={preview.postsCount} />
                  <Stat label="Subs" value={preview.subscriberCount} />
                  <Stat
                    label="Subscritos"
                    value={preview.subscriptionCount}
                    last
                  />
                </div>

                {!isOwnProfile && (
                  <div className="grid grid-cols-[1fr_1fr_1.45fr] gap-1.5 p-2.5">
                    <SubButton
                      key={String(preview.subscribedByMe)}
                      targetUserId={preview.id}
                      initialSubscribed={preview.subscribedByMe}
                      onToggle={(subscribed, subscriberCount) => {
                        setPreview((current) => {
                          if (!current) return current;
                          const next = {
                            ...current,
                            subscribedByMe: subscribed,
                            subscriberCount,
                          };
                          patchUserPreview(preview.id, next);
                          return next;
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => comingSoon("Ignorar", loggedIn)}
                    >
                      Ignorar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => comingSoon("Iniciar conversa", loggedIn)}
                    >
                      Iniciar conversa
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground p-4 text-sm">
                Não foi possível carregar o perfil.
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

function Stat({
  label,
  value,
  last,
}: {
  label: string;
  value: number;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-2 py-2.5 text-center",
        !last && "border-border border-r",
      )}
    >
      <div className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </div>
      <div className="text-foreground mt-0.5 text-sm font-semibold tabular-nums">
        {value.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}
