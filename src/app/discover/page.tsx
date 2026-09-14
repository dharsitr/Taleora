"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getBooks,
  getFeaturedBooks,
  getGenreStats,
  getPersonalizedRecommendations,
  getTrendingBooks,
} from "@/lib/books/queries";
import {
  BookWithAuthorAndGenres,
  BookSortOption,
  GenreWithCount,
} from "@/types/books";
import { DiscoverHero } from "@/components/discover/DiscoverHero";
import { TrendingStories } from "@/components/discover/TrendingStories";
import { FeaturedSection } from "@/components/discover/FeaturedSection";
import { PersonalizedRecommendations } from "@/components/discover/PersonalizedRecommendations";
import { GenreBrowser } from "@/components/discover/GenreBrowser";
import { DiscoverCatalog } from "@/components/discover/DiscoverCatalog";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // URL state initialization
  const initialQuery = searchParams.get("q") || "";
  const initialGenre = searchParams.get("genre") || "all";
  const initialTag = searchParams.get("tag") || null;
  const initialSort = (searchParams.get("sort") as BookSortOption) || "featured";
  const initialMinRating = parseFloat(searchParams.get("rating") || "0") || 0;

  // Filter and Search States
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = React.useState(initialGenre);
  const [selectedTag, setSelectedTag] = React.useState<string | null>(initialTag);
  const [minRating, setMinRating] = React.useState<number>(initialMinRating);
  const [dateRange, setDateRange] = React.useState<"all" | "month" | "year">("all");
  const [sortBy, setSortBy] = React.useState<BookSortOption>(initialSort);

  // Data States
  const [catalogBooks, setCatalogBooks] = React.useState<BookWithAuthorAndGenres[]>([]);
  const [trendingBooks, setTrendingBooks] = React.useState<BookWithAuthorAndGenres[]>([]);
  const [featuredBooks, setFeaturedBooks] = React.useState<BookWithAuthorAndGenres[]>([]);
  const [recommendations, setRecommendations] = React.useState<{
    books: BookWithAuthorAndGenres[];
    reason: string;
  }>({ books: [], reason: "" });
  const [genres, setGenres] = React.useState<GenreWithCount[]>([]);

  // Loading and Error States
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);
  const [loadingSections, setLoadingSections] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state changes with URL
  const updateUrlParams = React.useCallback(
    (newParams: {
      q?: string;
      genre?: string;
      tag?: string | null;
      sort?: string;
      rating?: number;
    }) => {
      const current = new URLSearchParams(searchParams.toString());

      if (newParams.q !== undefined) {
        if (newParams.q) current.set("q", newParams.q);
        else current.delete("q");
      }

      if (newParams.genre !== undefined) {
        if (newParams.genre && newParams.genre !== "all") current.set("genre", newParams.genre);
        else current.delete("genre");
      }

      if (newParams.tag !== undefined) {
        if (newParams.tag) current.set("tag", newParams.tag);
        else current.delete("tag");
      }

      if (newParams.sort !== undefined) {
        if (newParams.sort && newParams.sort !== "featured") current.set("sort", newParams.sort);
        else current.delete("sort");
      }

      if (newParams.rating !== undefined) {
        if (newParams.rating > 0) current.set("rating", newParams.rating.toString());
        else current.delete("rating");
      }

      const queryString = current.toString();
      router.replace(queryString ? `/discover?${queryString}` : "/discover", { scroll: false });
    },
    [router, searchParams]
  );

  // 1. Load curated discovery sections on mount / user change
  React.useEffect(() => {
    let isMounted = true;

    Promise.all([
      getTrendingBooks(6),
      getFeaturedBooks(2),
      getGenreStats(),
      getPersonalizedRecommendations(user?.id, 3),
    ])
      .then(([trending, featured, genreStats, recs]) => {
        if (isMounted) {
          setTrendingBooks(trending);
          setFeaturedBooks(featured);
          setGenres(genreStats);
          setRecommendations(recs);
          setLoadingSections(false);
        }
      })
      .catch((err) => {
        console.error("Error loading curated discover sections:", err);
        if (isMounted) setLoadingSections(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 2. Fetch catalog books whenever search, filters, or sorting change
  React.useEffect(() => {
    let isMounted = true;

    getBooks({
      search: searchQuery,
      genreSlug: selectedGenre,
      tag: selectedTag || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      dateRange: dateRange,
      sort: sortBy,
    })
      .then((data) => {
        if (isMounted) {
          setCatalogBooks(data);
          setLoadingCatalog(false);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching catalog books:", err);
        if (isMounted) {
          setError("Unable to load stories. Please verify your connection.");
          setLoadingCatalog(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedGenre, selectedTag, minRating, dateRange, sortBy]);

  // Handlers
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setLoadingCatalog(true);
    updateUrlParams({ q });
  };

  const handleGenreChange = (slug: string) => {
    setSelectedGenre(slug);
    setLoadingCatalog(true);
    updateUrlParams({ genre: slug });
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setLoadingCatalog(true);
    updateUrlParams({ tag });
  };

  const handleMinRatingChange = (rating: number) => {
    setMinRating(rating);
    setLoadingCatalog(true);
    updateUrlParams({ rating });
  };

  const handleSortChange = (sort: BookSortOption) => {
    setSortBy(sort);
    setLoadingCatalog(true);
    updateUrlParams({ sort });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedTag(null);
    setMinRating(0);
    setDateRange("all");
    setSortBy("featured");
    setLoadingCatalog(true);
    router.replace("/discover", { scroll: false });
  };

  const handleRetryCatalog = () => {
    setLoadingCatalog(true);
    setError(null);
    getBooks({
      search: searchQuery,
      genreSlug: selectedGenre,
      tag: selectedTag || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      dateRange: dateRange,
      sort: sortBy,
    })
      .then((data) => {
        setCatalogBooks(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error retrying catalog:", err);
        setError("Unable to load stories. Please try again.");
      })
      .finally(() => setLoadingCatalog(false));
  };

  // Only show hero sections if not heavily filtered by deep search
  const isSearchActive = Boolean(searchQuery.trim() || selectedTag || selectedGenre !== "all");

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto pb-20">
      {/* 1. Discover Hero & Tag Exploration */}
      <DiscoverHero
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedTag={selectedTag}
        onTagSelect={handleTagSelect}
      />

      {/* 2. Trending Stories Carousel/Grid */}
      {!isSearchActive && (
        <TrendingStories
          books={trendingBooks}
          loading={loadingSections}
        />
      )}

      {/* 3. Featured Editorial Spotlights */}
      {!isSearchActive && (
        <FeaturedSection
          books={featuredBooks}
          loading={loadingSections}
        />
      )}

      {/* 4. Personalized Recommendations Shelf */}
      {!isSearchActive && recommendations.books.length > 0 && (
        <PersonalizedRecommendations
          books={recommendations.books}
          reason={recommendations.reason}
          loading={loadingSections}
        />
      )}

      {/* 5. Browse by Genre & Worlds */}
      <GenreBrowser
        genres={genres}
        selectedGenre={selectedGenre}
        onSelectGenre={handleGenreChange}
        loading={loadingSections}
      />

      {/* 6. Filterable & Sortable Stories Catalog */}
      <DiscoverCatalog
        books={catalogBooks}
        genres={genres}
        selectedGenre={selectedGenre}
        onGenreChange={handleGenreChange}
        minRating={minRating}
        onMinRatingChange={handleMinRatingChange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedTag={selectedTag}
        onTagChange={handleTagSelect}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        loading={loadingCatalog}
        error={error}
        onRetry={handleRetryCatalog}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 animate-pulse">
          <div className="h-64 bg-secondary rounded-3xl" />
          <div className="h-40 bg-secondary rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <DiscoverContent />
    </React.Suspense>
  );
}
