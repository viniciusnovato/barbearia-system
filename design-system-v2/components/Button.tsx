"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "accent";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Mostra spinner mas mantém o texto (útil quando outra UI já comunica o estado) */
  loadingKeepLabel?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-700 text-neutral-0 hover:bg-primary-800 active:bg-primary-900 disabled:bg-neutral-300 disabled:text-neutral-500 shadow-1",
  secondary:
    "bg-surface-card text-text-primary border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken disabled:opacity-50",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-sunken hover:text-text-primary active:bg-surface-sunken disabled:opacity-50",
  destructive:
    "bg-danger text-neutral-0 hover:brightness-110 active:brightness-95 disabled:opacity-50 shadow-1",
  accent:
    "bg-accent-500 text-neutral-900 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 shadow-1 font-semibold",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm rounded-sm",
  md: "h-10 px-4 text-body-sm rounded-md",
  lg: "h-touch px-5 text-body rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, loadingKeepLabel, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:shadow-focus",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && <span className="ds-spinner" aria-hidden />}
      {loading && !loadingKeepLabel ? "Processando…" : children}
    </button>
  );
});
