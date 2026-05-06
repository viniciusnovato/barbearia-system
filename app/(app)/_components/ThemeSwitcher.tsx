"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { setThemeAction } from "../configuracoes/actions";
import { THEME_COOKIE, type Theme } from "@/lib/theme/cookie";

const OPTIONS: { id: Theme; label: string; icon: string }[] = [
  { id: "light", label: "Claro", icon: "☀" },
  { id: "dark", label: "Escuro", icon: "☾" },
  { id: "auto", label: "Automático", icon: "◐" },
];

interface Props { initial: Theme }

export function ThemeSwitcher({ initial }: Props) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [pending, startTransition] = useTransition();

  // Aplica o tema imediatamente no DOM (otimista)
  function applyToDocument(t: Theme) {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    let resolved: "light" | "dark" = "light";
    if (t === "dark") resolved = "dark";
    else if (t === "auto") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    html.setAttribute("data-theme", resolved);
  }

  // Sincroniza ao mudar preferência do sistema (quando theme === auto)
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyToDocument("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function pick(t: Theme) {
    setTheme(t);
    applyToDocument(t);
    // Cookie pra SSR pegar na próxima request
    document.cookie = `${THEME_COOKIE}=${t}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(async () => {
      await setThemeAction(t);
      toast.success("Tema atualizado");
    });
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface-sunken rounded-full">
      {OPTIONS.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => pick(o.id)}
            disabled={pending && active}
            className={`px-3 h-8 rounded-full text-body-sm transition-colors inline-flex items-center gap-1.5 ${
              active ? "bg-surface-card shadow-1 text-text-primary" : "text-text-muted hover:text-text-primary"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
