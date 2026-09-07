import type { Metadata } from "next";

import { NOINDEX_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Redefinir senha | VT Forums",
  robots: NOINDEX_ROBOTS,
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
