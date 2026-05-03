import { type ReactNode } from "react";
import { cn } from "../lib/cn";
import { StatusPill, type FieldStatus } from "./StatusPill";
import { AIIndicator } from "./AIIndicator";

interface FieldCardProps {
  label: string;
  value?: string;
  status: FieldStatus;
  helper?: string;
  origemCount?: number;
  fromAI?: boolean;
  onEdit?: () => void;
  onApprove?: () => void;
  onDiscard?: () => void;
  onShowOrigin?: () => void;
  className?: string;
  children?: ReactNode;
}

export function FieldCard({
  label,
  value,
  status,
  helper,
  origemCount,
  fromAI,
  onEdit,
  onApprove,
  onDiscard,
  onShowOrigin,
  className,
  children,
}: FieldCardProps) {
  const empty = !value && !children;

  return (
    <article
      className={cn(
        "group relative rounded-lg border bg-surface-card",
        "transition-all duration-base ease-out",
        "shadow-1 hover:shadow-2",
        status === "sugerido" && "border-status-suggested-ring",
        status === "editado"  && "border-status-edited-ring",
        status === "aprovado" && "border-status-approved-ring",
        status === "conflito" && "border-status-conflict-ring",
        status === "vazio"    && "border-border-subtle",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="flex flex-col gap-1">
          <h4
            className="font-sans text-body-sm font-medium uppercase text-text-secondary"
            style={{ letterSpacing: "0.06em" }}
          >
            {label}
          </h4>
          {helper && <p className="text-caption text-text-muted">{helper}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {fromAI && status === "sugerido" && <AIIndicator state="ready" />}
          <StatusPill status={status} />
        </div>
      </header>

      <div className="px-5 py-3">
        {empty ? (
          <p className="font-display text-h4 italic text-text-muted">
            Aguardando preenchimento…
          </p>
        ) : (
          <div className="font-display text-h4 text-text-primary leading-snug">
            {children ?? value}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 px-5 pb-4 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          {origemCount !== undefined && origemCount > 0 && (
            <button
              type="button"
              onClick={onShowOrigin}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 transition-colors"
            >
              <QuoteIcon className="size-3.5" />
              Ver origem ({origemCount})
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDiscard && status !== "vazio" && (
            <IconButton onClick={onDiscard} title="Descartar">
              <TrashIcon className="size-4" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton onClick={onEdit} title="Editar">
              <PencilIcon className="size-4" />
            </IconButton>
          )}
          {onApprove && status !== "aprovado" && status !== "vazio" && (
            <button
              type="button"
              onClick={onApprove}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-body-sm font-medium",
                "bg-status-approved-bg text-status-approved-fg",
                "ring-1 ring-inset ring-status-approved-ring",
                "hover:brightness-105 transition-all",
              )}
            >
              <CheckIcon className="size-3.5" />
              Aprovar
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function IconButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center size-8 rounded-md text-text-muted hover:bg-surface-sunken hover:text-text-primary transition-colors"
      {...rest}
    >
      {children}
    </button>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 7h4v4H8v3H5V9a2 2 0 012-2zm9 0h4v4h-3v3h-3V9a2 2 0 012-2z" />
    </svg>
  );
}
