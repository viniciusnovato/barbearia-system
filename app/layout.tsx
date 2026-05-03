import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visagismo — Consultoria de Imagem",
  description: "Sistema de visagismo para barbeiros consultivos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
