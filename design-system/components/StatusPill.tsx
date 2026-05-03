import { cn } from "../lib/cn";

export type FieldStatus = "vazio" | "sugerido" | "editado" | "aprovado" | "conflito";

const labels: Record<FieldStatus, string> = {
  vazio:    "Vazio",
  sugerido: "Sugerido pela IA",
  editado:  "Editado",
  aprovado: "Aprovado",
  conflito: "Contradição",
};

const styles: Record<FieldStatus, string> = {
  vazio:    "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
  sugerido: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
  editado:  "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring",
  aprovado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  conflito: "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring",
};

const dotStyles: Record<FieldStatus, string> = {
  vazio:    "bg-neutral-400",
  sugerido: "bg-ai-500",
  editado:  "bg-warning",
  aprovado: "bg-success",
  conflito: "bg-danger",
};

interface StatusPillProps {
  status: FieldStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusPill({ status, showDot = true, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 h-6 text-caption font-medium uppercase",
        "ring-1 ring-inset rounded-full",
        styles[status],
        className,
      )}
      style={{ letterSpacing: "0.06em" }}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", dotStyles[status])} />}
      {labels[status]}
    </span>
  );
}
