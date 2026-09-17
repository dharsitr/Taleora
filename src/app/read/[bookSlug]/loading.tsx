export default function ReaderLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-pulse">
      {/* Top Header Skeleton */}
      <div className="h-14 border-b border-border/70 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="h-4 w-20 bg-secondary/80 rounded-md" />
          <div className="h-4 w-32 bg-secondary/60 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-secondary/70 rounded-lg" />
          <div className="h-8 w-8 bg-secondary/70 rounded-lg" />
        </div>
      </div>

      {/* Reader Text Flow Skeleton */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col gap-6">
        <div className="h-8 w-2/3 bg-secondary/80 rounded-xl mb-4" />
        <div className="h-4 w-1/4 bg-secondary/50 rounded-md mb-8" />

        <div className="flex flex-col gap-3">
          <div className="h-4 w-full bg-secondary/60 rounded-md" />
          <div className="h-4 w-full bg-secondary/60 rounded-md" />
          <div className="h-4 w-5/6 bg-secondary/50 rounded-md" />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="h-4 w-full bg-secondary/60 rounded-md" />
          <div className="h-4 w-11/12 bg-secondary/60 rounded-md" />
          <div className="h-4 w-4/5 bg-secondary/50 rounded-md" />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="h-4 w-full bg-secondary/60 rounded-md" />
          <div className="h-4 w-full bg-secondary/60 rounded-md" />
          <div className="h-4 w-3/4 bg-secondary/50 rounded-md" />
        </div>
      </main>
    </div>
  );
}
