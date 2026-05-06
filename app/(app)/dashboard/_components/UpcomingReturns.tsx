"use client";

import Link from "next/link";

interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  next_return_at: string | null;
  next_return_note: string | null;
  days_to_return: number | null;
}

export function UpcomingReturns({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong p-6 text-center">
        <p className="text-body-sm text-text-muted">Nenhum retorno agendado nos próximos 14 dias.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {clients.map((c) => {
        const overdue = (c.days_to_return ?? 0) < 0;
        const today = (c.days_to_return ?? 0) === 0;
        const status = overdue ? "atrasado" : today ? "hoje" : "agendado";
        return (
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
                <p className="text-body-sm text-text-muted truncate">
                  {new Date(c.next_return_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                  {c.next_return_note ? ` · ${c.next_return_note}` : ""}
                </p>
              </div>
              <span
                className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset shrink-0 ${
                  overdue
                    ? "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring"
                    : today
                    ? "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring"
                    : "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring"
                }`}
                style={{ letterSpacing: "0.06em" }}
              >
                {overdue ? `Atrasado ${Math.abs(c.days_to_return!)}d` : today ? "Hoje" : `Em ${c.days_to_return}d`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
