"use client";

import { cn } from "../lib/cn";

interface Props {
  /**
   * 0-100. Se omitido, vira indeterminado (animação infinita,
   * sem porcentagem).
   */
  value?: number;
  /** Texto à esquerda da barra (ex: "Transcrevendo áudio") */
  label?: string;
  /** Texto à direita (ex: "62%" ou "estimando…") */
  hint?: string;
  /** Tamanho da barra */
  size?: "sm" | "md";
  /** Tonalidade — primary (navy) é default; accent (cyan) destaca etapa "ativa" */
  tone?: "primary" | "accent";
  /** Se a barra deve receber shimmer (usado em determinadas em andamento). */
  animated?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2",
};

export function ProgressBar({
  value,
  label,
  hint,
  size = "md",
  tone = "primary",
  animated = true,
  className,
}: Props) {
  const indeterminate = value === undefined;
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between mb-1.5 gap-3">
          {label && (
            <span className="text-caption text-text-secondary truncate">{label}</span>
          )}
          {hint && (
            <span className="font-mono text-mono text-text-muted shrink-0">
              {hint}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "ds-progress relative",
          SIZE[size],
          indeterminate && "ds-progress--indeterminate",
        )}
      >
        {!indeterminate && (
          <div
            className={cn(
              "ds-progress__fill h-full",
              animated && "ds-progress__fill--shimmer",
              tone === "accent" && "bg-gradient-to-r from-accent-500 to-primary-500",
            )}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
    </div>
  );
}
