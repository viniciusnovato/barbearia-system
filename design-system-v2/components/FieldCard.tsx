"use client";

import { cn } from "../lib/cn";
import { StatusPill, type FieldStatus } from "./StatusPill";

interface Props {
  label: string;
  helper?: string;
  value: string | null;
  status: FieldStatus;
  /** Botões/ações da linha (ex: aprovar, reatribuir). */
  actions?: React.ReactNode;
  /** Callback de clique no card inteiro (entrar em edição). */
  onClick?: () => void;
  className?: string;
}

const RING: Record<FieldStatus, string> = {
  vazio:    "ring-border-subtle",
  sugerido: "ring-accent-300",
  editado:  "ring-status-edited-ring",
  aprovado: "ring-status-approved-ring",
  conflito: "ring-status-conflict-ring",
};

export function FieldCard({ label, helper, value, status, actions, onClick, className }: Props) {
  const isEmpty = !value || status === "vazio";
  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-md bg-surface-card ring-1 ring-inset transition-all",
        "hover:ring-primary-500 focus-within:ring-primary-500 focus-within:shadow-focus",
        onClick && "cursor-pointer",
        RING[status],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-mono uppercase text-text-muted tracking-wide truncate">
            {label}
          </p>
          {helper && (
            <p className="text-caption text-text-muted mt-0.5">{helper}</p>
          )}
        </div>
        <StatusPill status={status} />
      </div>

      <div className="px-4 pb-3">
        {isEmpty ? (
          <p className="text-body-sm text-text-muted italic">
            Sem conteúdo. Clique para preencher.
          </p>
        ) : (
          <p
            className={cn(
              "text-body whitespace-pre-wrap",
              status === "sugerido" && "text-text-secondary",
              status !== "sugerido" && "text-text-primary",
            )}
          >
            {value}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-1.5 px-4 pb-3 pt-1 border-t border-border-subtle">
          {actions}
        </div>
      )}
    </div>
  );
}
