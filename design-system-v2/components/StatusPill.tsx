import { cn } from "../lib/cn";

export type FieldStatus = "vazio" | "sugerido" | "editado" | "aprovado" | "conflito";

const LABELS: Record<FieldStatus, string> = {
  vazio: "Vazio",
  sugerido: "IA sugeriu",
  editado: "Editado",
  aprovado: "Aprovado",
  conflito: "Conflito",
};

const STYLES: Record<FieldStatus, string> = {
  vazio:
    "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
  sugerido:
    "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
  editado:
    "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring",
  aprovado:
    "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  conflito:
    "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring",
};

const DOT: Record<FieldStatus, string> = {
  vazio: "bg-neutral-400",
  sugerido: "bg-accent-500",
  editado: "bg-warning",
  aprovado: "bg-success",
  conflito: "bg-danger",
};

interface Props {
  status: FieldStatus;
  className?: string;
  /** Texto custom (override) */
  children?: React.ReactNode;
}

export function StatusPill({ status, className, children }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-caption font-medium ring-1 ring-inset",
        "uppercase tracking-wide",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} />
      {children ?? LABELS[status]}
    </span>
  );
}
