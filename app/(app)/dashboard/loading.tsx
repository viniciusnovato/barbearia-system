import { ClientListSkeleton, Skeleton, StatsRowSkeleton } from "@ds/components/skeletons";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <div className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="mb-10">
        <StatsRowSkeleton />
      </div>
      <div className="grid md:grid-cols-2 gap-3 mb-10">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
      </div>
      <ClientListSkeleton rows={5} />
    </main>
  );
}
