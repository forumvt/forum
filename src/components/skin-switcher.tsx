"use client";

import { BookMarked, Check, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSkin } from "./skin-provider";

export function SkinSwitcher() {
  const { skin, setSkin } = useSkin();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Tema visual">
          {skin === "principia" ? (
            <BookMarked className="size-[1.2rem]" />
          ) : (
            <LayoutGrid className="size-[1.2rem]" />
          )}
          <span className="sr-only">Trocar tema visual</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSkin("default")}>
          <LayoutGrid />
          <span className="flex-1">Fórum normal</span>
          {skin === "default" && <Check className="text-foreground" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSkin("principia")}>
          <BookMarked />
          <span className="flex-1">Principia Discordia</span>
          {skin === "principia" && <Check className="text-foreground" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
