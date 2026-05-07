import { cn } from "../lib/cn";

interface Props {
  className?: string;
  /** Default: bloco retangular. `text` = linha de texto. `circle` = avatar. */
  shape?: "rect" | "text" | "circle";
}

export function Skeleton({ className, shape = "rect" }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "ds-skeleton block",
        shape === "text" && "h-4 rounded-sm",
        shape === "circle" && "rounded-full",
        className,
      )}
    />
  );
}

/** Skeletons compostos prontos para listas e cards comuns. */
export function FieldCardSkeleton() {
  return (
    <div className="rounded-md border border-border-subtle p-4 bg-surface-card flex flex-col gap-3">
      <Skeleton className="w-32 h-3" />
      <Skeleton className="w-full h-5" />
      <Skeleton className="w-3/4 h-5" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="w-16 h-7 rounded-full" />
        <Skeleton className="w-20 h-7 rounded-full" />
      </div>
    </div>
  );
}

export function ClientRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-surface-card border border-border-subtle">
      <Skeleton shape="circle" className="size-10" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="w-40 h-3.5" />
        <Skeleton className="w-24 h-3" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}
