"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "./ui/button";

interface SidebarButtonProps {
  children: React.ReactNode;
  href: React.ComponentProps<typeof Link>["href"];
}

const SidebarButton = ({ children, href }: SidebarButtonProps) => {
  const pathName = usePathname();
  const isActive = pathName === href;

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start gap-2"
      asChild
    >
      <Link href={href} aria-current={isActive ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
};

export default SidebarButton;
