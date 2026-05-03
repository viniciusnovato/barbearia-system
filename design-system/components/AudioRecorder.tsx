import { cn } from "../lib/cn";

interface AudioRecorderProps {
  state: "idle" | "recording" | "paused" | "processing";
  duration?: string;
  levels?: number[];
  onToggle?: () => void;
  onFinish?: () => void;
  className?: string;
}

const stateLabel: Record<AudioRecorderProps["state"], string> = {
  idle:       "Toque para gravar",
  recording:  "Gravando conversa",
  paused:     "Pausado",
  processing: "Enviando para análise…",
};

export function AudioRecorder({
  state,
  duration = "00:00",
  levels = Array.from({ length: 32 }, () => 0.4),
  onToggle,
  onFinish,
  className,
}: AudioRecorderProps) {
  const isLive = state === "recording";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface-card shadow-3 p-7",
        "border border-border-subtle",
        className,
      )}
    >
      <header className="flex items-center justify-between mb-6">
        <span
          className="font-mono text-mono uppercase text-text-muted"
          style={{ letterSpacing: "0.1em" }}
        >
          {stateLabel[state]}
        </span>
        <span className="font-mono text-h3 text-text-primary tabular-nums">{duration}</span>
      </header>

      <div className="flex items-end justify-center gap-1 h-24 mb-7">
        {levels.map((lvl, i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full origin-bottom",
              isLive ? "bg-primary-500 animate-waveform" : "bg-neutral-300",
            )}
            style={{
              height: `${Math.max(8, lvl * 100)}%`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full size-touch",
            "shadow-2 transition-all duration-base ease-out",
            "focus-visible:outline-none focus-visible:shadow-focus",
            isLive
              ? "bg-danger text-neutral-50"
              : "bg-primary-500 text-neutral-50 hover:bg-primary-600",
          )}
          style={{ width: 72, height: 72 }}
          aria-label={isLive ? "Pausar gravação" : "Iniciar gravação"}
        >
          {isLive && (
            <span className="absolute inset-0 rounded-full bg-danger/40 animate-pulseRing" />
          )}
          {isLive ? (
            <span className="size-6 rounded-sm bg-current" />
          ) : (
            <span className="size-6 rounded-full bg-current" />
          )}
        </button>

        {state !== "idle" && (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex items-center justify-center size-touch rounded-full border border-border-strong text-text-primary hover:bg-surface-sunken transition-colors"
            aria-label="Finalizar e processar"
            style={{ width: 56, height: 56 }}
          >
            <CheckIcon className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
