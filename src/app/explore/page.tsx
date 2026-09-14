"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ExploreRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/discover?${q}` : "/discover");
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-serif">
          Opening Discover Catalog...
        </span>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ExploreRedirectContent />
    </React.Suspense>
  );
}
