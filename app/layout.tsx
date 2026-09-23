import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HunterX — Lead Intelligence",
    template: "%s — HunterX",
  },
  description: "Encontre negócios locais, priorize oportunidades e organize sua prospecção em um único workspace.",
  keywords: ["prospecção", "leads locais", "Google Maps", "CRM", "lead intelligence"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
