"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserHoverCard, type UserHoverSide } from "@/components/user-hover-card";
import { userProfilePath } from "@/lib/app-url";
import { cn, displayUserName, userInitials } from "@/lib/utils";

type UserLinkProps = {
  userId?: string | null;
  name: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
};

export function UserNameLink({
  userId,
  name,
  className,
  children,
}: UserLinkProps) {
  const label = displayUserName(name);
  const content = children ?? label;

  if (!userId) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link
      href={userProfilePath(userId) as never}
      className={cn(
        "hover:text-primary rounded-sm underline-offset-2 hover:underline",
        className,
      )}
    >
      {content}
    </Link>
  );
}

type UserAvatarLinkProps = {
  userId?: string | null;
  name: string | null | undefined;
  avatar?: string | null;
  className?: string;
  showHoverCard?: boolean;
  hoverSide?: UserHoverSide;
};

export function UserAvatarLink({
  userId,
  name,
  avatar,
  className,
  showHoverCard = true,
  hoverSide = "right",
}: UserAvatarLinkProps) {
  const label = displayUserName(name);
  const avatarEl = (
    <Avatar
      className={cn(
        "border-border size-10 shrink-0 rounded-none border",
        className,
      )}
    >
      <AvatarImage src={avatar || "/placeholder.svg"} alt={label} />
      <AvatarFallback className="bg-muted text-muted-foreground">
        {userInitials(name)}
      </AvatarFallback>
    </Avatar>
  );

  if (!userId) return avatarEl;

  const link = (
    <Link
      href={userProfilePath(userId) as never}
      aria-label={`Ver perfil de ${label}`}
      className="focus-visible:ring-ring inline-flex rounded-sm outline-none focus-visible:ring-[3px]"
    >
      {avatarEl}
    </Link>
  );

  if (!showHoverCard) return link;

  return (
    <UserHoverCard userId={userId} side={hoverSide}>
      {link}
    </UserHoverCard>
  );
}
