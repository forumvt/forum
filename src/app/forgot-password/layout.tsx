import type { Metadata } from "next";

import { NOINDEX_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Esqueci a senha | VT Forums",
  robots: NOINDEX_ROBOTS,
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
