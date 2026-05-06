// Skeletons reutilizáveis para estados de carregamento.
// Estilo shimmer suave com cor neutra wovem; respeita dark mode.

import { cn } from "../../lib/cn";

const shimmerBase =
  "relative overflow-hidden bg-surface-sunken before:absolute before:inset-0 " +
  "before:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.35)_50%,transparent_70%)] " +
  "dark:before:bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.07)_50%,transparent_70%)] " +
  "before:bg-[length:200%_100%] before:animate-shimmer";

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn(shimmerBase, "rounded-md inline-block", className)} aria-hidden />;
}

export function ClientCardSkeleton() {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-card border border-border-subtle">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </li>
  );
}

export function ClientListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <ClientCardSkeleton key={i} />
      ))}
    </ul>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg bg-surface-card border border-border-subtle overflow-hidden">
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-surface-card border border-border-subtle p-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-20 mt-1" />
          <Skeleton className="h-3 w-3/4 mt-1" />
        </div>
      ))}
    </div>
  );
}

export function FieldCardSkeleton() {
  return (
    <article className="rounded-lg border border-border-subtle bg-surface-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
    </article>
  );
}
