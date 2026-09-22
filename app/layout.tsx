import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HunterX — Lead Intelligence",
  description: "Inteligência comercial para descobrir, qualificar e abordar negócios locais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
