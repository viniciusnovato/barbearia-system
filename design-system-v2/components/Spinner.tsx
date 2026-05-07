"use client";

import { cn } from "../lib/cn";

interface Props {
  size?: "xs" | "sm" | "md" | "lg";
  /** Cor do spinner — herda currentColor por padrão. */
  className?: string;
  /** Texto opcional ao lado (ex: "Salvando") */
  label?: string;
}

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  xs: "text-[10px]",
  sm: "text-[14px]",
  md: "text-[18px]",
  lg: "text-[28px]",
};

export function Spinner({ size = "sm", className, label }: Props) {
  if (label) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-text-secondary", SIZE[size], className)}>
        <span className="ds-spinner" aria-hidden />
        <span className="text-body-sm">{label}</span>
      </span>
    );
  }
  return <span className={cn("ds-spinner", SIZE[size], className)} role="status" aria-label="Carregando" />;
}
