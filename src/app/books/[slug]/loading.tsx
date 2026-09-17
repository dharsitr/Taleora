export default function BookDetailsLoading() {
  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-36 bg-secondary/70 rounded-md" />

      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Mock */}
          <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-xl bg-secondary/80 shrink-0" />

          {/* Details */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-secondary/80 rounded-full" />
              <div className="h-6 w-24 bg-secondary/60 rounded-full" />
            </div>
            <div className="h-8 sm:h-12 w-3/4 bg-secondary/90 rounded-xl" />
            <div className="h-4 w-1/2 bg-secondary/60 rounded-md" />
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-28 bg-secondary/60 rounded-md" />
              <div className="h-4 w-20 bg-secondary/60 rounded-md" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-11 w-32 bg-primary/30 rounded-xl" />
              <div className="h-11 w-32 bg-secondary/70 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Synopsis Area Skeleton */}
        <div className="p-6 sm:p-8 border-t border-border/60 flex flex-col gap-3">
          <div className="h-5 w-32 bg-secondary/80 rounded-md" />
          <div className="h-4 w-full bg-secondary/50 rounded-md" />
          <div className="h-4 w-5/6 bg-secondary/40 rounded-md" />
        </div>
      </div>

      {/* Chapter List Skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-6 w-36 bg-secondary/80 rounded-md" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl border border-border/50 bg-card/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
