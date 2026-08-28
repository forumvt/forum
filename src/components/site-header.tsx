"use client";

import {
  LogOutIcon,
  Mail,
  Search,
  SettingsIcon,
  Shield,
  UserIcon,
  Users,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";

import { NotificationBell } from "@/components/notification-bell";
import { PmInboxButton } from "@/components/pm-inbox-button";
import { SearchForm } from "@/components/search-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { userProfilePath } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import { getSessionRole, isStaff } from "@/lib/permissions";

import { LoginDialog } from "./login-dialog";
import { RegisterDialog } from "./register-dialog";
import { useSkin } from "./skin-provider";
import { SkinSwitcher } from "./skin-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";

const emptySubscribe = () => () => {};

export function SiteHeader() {
  // Evita divergência de hidratação: no servidor devolve false, no cliente true.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { skin } = useSkin();
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const user = session?.user;
  const staff = isStaff(getSessionRole(user));
  const initials = `${user?.name?.split(" ")?.[0]?.[0] ?? ""}${
    user?.name?.split(" ")?.[1]?.[0] ?? ""
  }`;

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:px-4">
        <SidebarTrigger className="-ml-1 shrink-0" />
        {/* Logo */}
        <Link
          href="/"
          className="focus-visible:ring-ring flex min-w-0 shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-[3px]"
        >
          <span className="chaos-heading truncate text-base font-bold tracking-tight sm:text-lg">
            VT Forums
          </span>
          {skin === "principia" && (
            <span className="text-muted-foreground hidden text-xs sm:inline">
              Principia
            </span>
          )}
        </Link>

        {/* Search */}
        <div className="mx-auto hidden max-w-xl min-w-0 flex-1 items-center md:flex">
          <Suspense
            fallback={
              <Skeleton className="h-9 w-full rounded-md" aria-hidden="true" />
            }
          >
            <SearchForm />
          </Suspense>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          asChild
          aria-label="Pesquisar tópicos"
        >
          <Link href={"/search" as never}>
            <Search className="size-4" />
          </Link>
        </Button>

        <nav
          className="ml-auto flex shrink-0 items-center gap-1"
          suppressHydrationWarning
        >
          <SkinSwitcher />
          <ThemeSwitcher />
          {mounted ? (
            user ? (
              <>
                <NotificationBell />
                <PmInboxButton />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      aria-label="Abrir menu da conta"
                    >
                      <Avatar className="size-8">
                        <AvatarImage
                          src={(user.image as string | undefined) || undefined}
                          alt=""
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage
                          src={(user.image as string | undefined) || undefined}
                          alt=""
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() =>
                        router.push(userProfilePath(user.id) as never)
                      }
                    >
                      <UserIcon />
                      Meu perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/mensagens" as never)}
                    >
                      <Mail />
                      Mensagens
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/subs" as never)}
                    >
                      <Users />
                      Meus subs
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/ignorados" as never)}
                    >
                      <UserX />
                      Ignorados
                    </DropdownMenuItem>
                    {staff ? (
                      <DropdownMenuItem
                        onClick={() => router.push("/moderacao" as never)}
                      >
                        <Shield />
                        Moderação
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <SettingsIcon />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => authClient.signOut()}
                    >
                      <LogOutIcon />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <LoginDialog />
                <RegisterDialog />
              </div>
            )
          ) : (
            <div className="flex items-center gap-1">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
