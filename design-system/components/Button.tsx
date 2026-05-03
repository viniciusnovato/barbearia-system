import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "ai";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-all duration-base ease-out " +
  "focus-visible:outline-none focus-visible:shadow-focus " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm rounded-md",
  md: "h-11 px-5 text-body rounded-md min-w-touch",
  lg: "h-touch px-6 text-body-lg rounded-lg",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-neutral-50 shadow-1 " +
    "hover:bg-primary-600 active:bg-primary-700",
  secondary:
    "bg-surface-card text-text-primary border border-border-strong " +
    "hover:bg-surface-sunken active:border-primary-500",
  ghost:
    "bg-transparent text-text-primary " +
    "hover:bg-surface-sunken active:bg-neutral-200",
  destructive:
    "bg-danger text-neutral-50 " +
    "hover:brightness-110 active:brightness-95",
  ai:
    "relative text-text-on-ai bg-ai-500 shadow-1 " +
    "hover:bg-ai-600 active:bg-ai-700 " +
    "focus-visible:shadow-focus-ai " +
    "before:absolute before:inset-0 before:rounded-[inherit] " +
    "before:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.18)_50%,transparent_70%)] " +
    "before:bg-[length:200%_100%] before:animate-shimmer before:pointer-events-none",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leadingIcon, trailingIcon, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {loading ? (
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        leadingIcon && <span className="shrink-0">{leadingIcon}</span>
      )}
      <span className="relative">{children}</span>
      {!loading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
    </button>
  );
});
