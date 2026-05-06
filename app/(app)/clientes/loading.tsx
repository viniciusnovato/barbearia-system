import { ClientListSkeleton, Skeleton } from "@ds/components/skeletons";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-touch w-32" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-touch w-full mb-6" />
      <ClientListSkeleton rows={8} />
    </main>
  );
}
