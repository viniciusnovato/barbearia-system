import { cn } from "../lib/cn";

interface AIIndicatorProps {
  state?: "idle" | "processing" | "ready";
  label?: string;
  className?: string;
}

const stateLabels: Record<NonNullable<AIIndicatorProps["state"]>, string> = {
  idle:       "Sugerido pela IA",
  processing: "Processando…",
  ready:      "Pronto para revisão",
};

export function AIIndicator({ state = "idle", label, className }: AIIndicatorProps) {
  const text = label ?? stateLabels[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 h-6 rounded-full",
        "bg-ai-50 text-ai-700 text-caption font-medium",
        "ring-1 ring-inset ring-ai-200",
        className,
      )}
      style={{ letterSpacing: "0.04em" }}
    >
      <SparkleIcon className={cn("size-3", state === "processing" && "animate-spin")} />
      {text}
    </span>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.5l1.8 5.7 5.7 1.8-5.7 1.8L12 17.5l-1.8-5.7-5.7-1.8 5.7-1.8L12 2.5z"
        fill="currentColor"
      />
      <circle cx="19" cy="5" r="1.2" fill="currentColor" />
      <circle cx="5" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
