import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme/cookie";

export const metadata: Metadata = {
  title: { default: "Visagismo · Consultoria de Imagem", template: "%s · Visagismo" },
  description: "Sistema de visagismo para barbeiros consultivos: dossiês, IA, anotação iPad e PDF premium.",
  applicationName: "Visagismo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Visagismo",
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#17150F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(THEME_COOKIE)?.value;
  const theme: Theme = isTheme(stored) ? stored : "light";
  // Para "auto", deixa light no SSR e o ThemeSwitcher (client) corrige após hidratar
  const dataTheme = theme === "dark" ? "dark" : "light";

  return (
    <html lang="pt-BR" data-theme={dataTheme}>
      <head>
        {/* Script inline pra evitar flash quando theme=auto:
            lê cookie + matchMedia ANTES de pintar e ajusta data-theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=document.cookie.match(/visagismo-theme=(light|dark|auto)/);var t=c?c[1]:'${theme}';var resolved=t==='dark'?'dark':t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',resolved);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
