export default function RootLoading() {
  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto w-full animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="rounded-3xl border border-border/60 bg-secondary/30 p-8 sm:p-12 flex flex-col gap-6">
        <div className="h-4 w-28 bg-primary/20 rounded-full" />
        <div className="h-10 sm:h-14 w-3/4 max-w-lg bg-secondary/80 rounded-2xl" />
        <div className="h-4 w-full max-w-md bg-secondary/60 rounded-md" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-32 bg-primary/30 rounded-xl" />
          <div className="h-10 w-28 bg-secondary/80 rounded-xl" />
        </div>
      </div>

      {/* Curated Shelves Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-secondary/80 rounded-lg" />
          <div className="h-4 w-20 bg-secondary/50 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col h-80"
            >
              <div className="h-48 bg-secondary/60" />
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="h-4 w-3/4 bg-secondary/80 rounded-md" />
                <div className="h-3 w-1/2 bg-secondary/50 rounded-md" />
                <div className="h-3 w-full bg-secondary/40 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
