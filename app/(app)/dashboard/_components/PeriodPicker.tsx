"use client";

import Link from "next/link";

interface Props {
  current: string;
}

const OPTIONS = [
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "last_30", label: "Últimos 30 dias" },
  { id: "last_90", label: "Últimos 90 dias" },
  { id: "this_year", label: "Este ano" },
];

export function PeriodPicker({ current }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = current === o.id;
        return (
          <Link
            key={o.id}
            href={`/dashboard?period=${o.id}`}
            className={`h-8 px-3 inline-flex items-center rounded-full text-caption transition-colors ${
              active
                ? "bg-neutral-900 text-neutral-50"
                : "bg-surface-card border border-border-subtle text-text-secondary hover:border-border-strong"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

