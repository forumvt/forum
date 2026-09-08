import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta | VT Forums",
  description: "Cadastre-se no VT Forums para participar das discussões.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
