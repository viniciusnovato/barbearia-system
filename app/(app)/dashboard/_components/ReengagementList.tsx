"use client";

import Link from "next/link";
import { motion } from "motion/react";

interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  instagram: string | null;
  last_visit_at: string | null;
  days_since_visit: number;
  client_status: string;
}

const STATUS_STYLES: Record<string, string> = {
  dormindo: "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring",
  frio: "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring",
  perdido: "bg-neutral-200 text-neutral-700 ring-neutral-300",
};
const STATUS_LABELS: Record<string, string> = {
  dormindo: "Dormindo",
  frio: "Frio",
  perdido: "Perdido",
};

export function ReengagementList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
        <p className="font-display text-h4 text-text-muted">Tudo em dia 🎉</p>
        <p className="text-body-sm text-text-secondary mt-2">Nenhum cliente parado por mais de 30 dias.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {clients.map((c, i) => (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-colors"
        >
          <Link
            href={`/clientes/${c.id}`}
            className="flex items-center gap-3 flex-1 min-w-0 group"
          >
            <span className="size-10 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm shrink-0">
              {c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-h4 truncate group-hover:text-primary-600 transition-colors">{c.full_name}</p>
              <p className="text-body-sm text-text-muted">
                Há <strong>{c.days_since_visit}</strong> dias sem vir
                {c.instagram && ` · ${c.instagram}`}
              </p>
            </div>
          </Link>

          <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${STATUS_STYLES[c.client_status] ?? STATUS_STYLES.dormindo}`} style={{ letterSpacing: "0.06em" }}>
            {STATUS_LABELS[c.client_status] ?? c.client_status}
          </span>

          {c.phone && (
            <a
              href={whatsappLink(c.phone, c.full_name, c.days_since_visit)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-success/10 text-success hover:bg-success/20 ring-1 ring-inset ring-success/30 text-body-sm font-medium transition-colors"
              title="Mandar mensagem no WhatsApp"
            >
              <WaIcon /> WhatsApp
            </a>
          )}
        </motion.li>
      ))}
    </ul>
  );
}

function whatsappLink(phone: string, name: string, days: number): string {
  const cleaned = phone.replace(/\D/g, "");
  const msg = `Oi ${name.split(" ")[0]}, faz ${days} dias que a gente não se vê. Bora marcar um horário pra dar manutenção no visual?`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.2-.6-1.5-.9-2-.2-.5-.5-.5-.6-.5h-.6c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1 2.7.1.2 1.8 2.7 4.4 3.8 2.6 1 2.6.7 3.1.6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z M12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 2.9 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}
