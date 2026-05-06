"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { dismissNotificationAction } from "../_actions/notifications";

interface Notification {
  key: string;
  type: string;
  title: string;
  body: string;
  link: string;
}

const TYPE_ICON: Record<string, string> = {
  return_today: "🟢",
  return_tomorrow: "🔵",
  return_overdue: "🔴",
  inactive: "💤",
  product_reposicao: "📦",
};

export function NotificationBell({ initial }: { initial: Notification[] }) {
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const count = list.length;

  function dismiss(key: string) {
    startTransition(async () => {
      await dismissNotificationAction(key);
      setList((prev) => prev.filter((n) => n.key !== key));
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={count > 0 ? `${count} alerta(s)` : "Nenhum alerta"}
        className="relative size-9 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 max-h-[70vh] overflow-y-auto rounded-lg bg-surface-card border border-border-strong shadow-3">
            <header className="px-3 py-2.5 border-b border-border-subtle sticky top-0 bg-surface-card">
              <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
                Alertas {count > 0 && `· ${count}`}
              </p>
            </header>
            {list.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-body-sm text-text-muted">Nada urgente. 🎉</p>
              </div>
            ) : (
              <ul>
                {list.map((n) => (
                  <li key={n.key} className="border-b border-border-subtle last:border-b-0 group">
                    <div className="flex items-start gap-2 p-3 hover:bg-surface-sunken transition-colors">
                      <span className="text-h4 leading-none">{TYPE_ICON[n.type] ?? "•"}</span>
                      <Link href={n.link} onClick={() => setOpen(false)} className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium truncate">{n.title}</p>
                        <p className="text-caption text-text-muted truncate">{n.body}</p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => dismiss(n.key)}
                        disabled={pending}
                        title="Dispensar"
                        className="size-7 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-surface-card hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
