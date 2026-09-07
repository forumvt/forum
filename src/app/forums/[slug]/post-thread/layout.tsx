import type { Metadata } from "next";

import { NOINDEX_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Criar tópico | VT Forums",
  robots: NOINDEX_ROBOTS,
};

export default function PostThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
