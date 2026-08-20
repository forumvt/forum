"use client";

import {
  ChevronDown,
  Flame,
  Gamepad2,
  Home,
  MessageSquare,
  MessageSquareText,
  Search,
  Settings,
  TvIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Início", icon: Home, url: "/" },
  { title: "Pesquisar", icon: Search, url: "/search" },
  { title: "Fóruns", icon: TvIcon, url: "/forums" },
  { title: "Gaming", icon: Gamepad2, url: "/forums/jogos-em-geral" },
  {
    title: "Vale Tudo",
    icon: MessageSquareText,
    url: "/forums/vale-tudo",
  },
  { title: "Meus subs", icon: Users, url: "/subs" },
  { title: "Em Alta", icon: Flame, url: "#" },
];

export function ForumSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive = item.url !== "#" && pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.url as never}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <Collapsible defaultOpen className="group/topicos">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <MessageSquare />
                      <span>Tópicos</span>
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/topicos:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href={"/subs" as never}>Meus subs</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/?filter=answered-by-me">
                            Respondidos por mim
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/?filter=viewed-by-me">
                            Visualizadas por mim
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link
                href="/settings"
                aria-current={pathname === "/settings" ? "page" : undefined}
              >
                <Settings />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
