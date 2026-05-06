"use client";

import Link from "next/link";

interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  last_visit_at: string | null;
  days_since_visit: number;
}

export function AnniversaryList({ clients }: { clients: Client[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {clients.map((c) => (
        <li key={c.id}>
          <Link
            href={`/clientes/${c.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 transition-colors"
          >
            <span className="size-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm">
              {c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-h4 truncate">{c.full_name}</p>
              <p className="text-body-sm text-text-muted">Última visita há {c.days_since_visit} dias</p>
            </div>
            <span className="font-mono text-caption text-text-muted uppercase" style={{ letterSpacing: "0.06em" }}>
              ✦ retorno
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
