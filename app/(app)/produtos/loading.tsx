import { ProductGridSkeleton, Skeleton } from "@ds/components/skeletons";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-touch w-32" />
      </div>
      <ProductGridSkeleton items={6} />
    </main>
  );
}
