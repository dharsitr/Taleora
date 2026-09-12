import { Story, ReadingStats } from "@/types";

export const MOCK_CURRENT_READ: Story = {
  id: "story-1",
  title: "The Cartographer of Lost Constellations",
  subtitle: "A journey through uncharted star-routes and forgotten memories",
  author: "Elian Vance",
  coverGradient: "from-amber-700 via-stone-800 to-zinc-950",
  coverAccent: "#E28743",
  genre: "Celestial Fantasy",
  readTimeMinutes: 280,
  rating: 4.9,
  reviewsCount: 1420,
  description:
    "When an astronomer maps a rogue nebula, she uncovers ancient celestial paths carved by dreamers centuries before.",
  chaptersCount: 24,
  currentChapter: 8,
  progressPercentage: 35,
  lastReadAt: "2 hours ago",
  featured: true,
  tags: ["Astrolabe", "Introspective", "Mythology"],
};

export const MOCK_STORIES: Story[] = [
  MOCK_CURRENT_READ,
  {
    id: "story-2",
    title: "Whispers in the Archive of Glass",
    subtitle: "Every memory has an echo, if you listen closely enough",
    author: "Mira Thorne",
    coverGradient: "from-emerald-800 via-teal-950 to-stone-900",
    coverAccent: "#34D399",
    genre: "Gothic Mystery",
    readTimeMinutes: 340,
    rating: 4.8,
    reviewsCount: 890,
    description:
      "A quiet archivist in a crystalline library discovers that certain preserved transcripts bleed real ink into the present.",
    chaptersCount: 30,
    trending: true,
    tags: ["Atmospheric", "Library", "Enigma"],
  },
  {
    id: "story-3",
    title: "Clockwork Skylines & Iron Crows",
    subtitle: "Steam, soot, and the rebellion taking wing above the clouds",
    author: "Kaelen Mercer",
    coverGradient: "from-orange-800 via-amber-950 to-neutral-900",
    coverAccent: "#F97316",
    genre: "Steampunk Fiction",
    readTimeMinutes: 210,
    rating: 4.7,
    reviewsCount: 650,
    description:
      "An apprentice mechanic crafts mechanical couriers that begin delivering secrets meant only for the Emperor's eyes.",
    chaptersCount: 18,
    trending: true,
    tags: ["Inventors", "Action", "Dystopian"],
  },
  {
    id: "story-4",
    title: "The Tea Merchant's Garden of Parables",
    subtitle: "Where each brew steeps an old tale into existence",
    author: "Sora Lin",
    coverGradient: "from-stone-700 via-stone-800 to-stone-950",
    coverAccent: "#EAB308",
    genre: "Philosophical Fiction",
    readTimeMinutes: 190,
    rating: 4.95,
    reviewsCount: 2100,
    description:
      "A wandering herbalist settles in a mist-shrouded valley, serving teas that awaken the unspoken truths of his guests.",
    chaptersCount: 16,
    featured: true,
    tags: ["Cozy", "Wisdom", "Folklore"],
  },
  {
    id: "story-5",
    title: "Echoes of the Obsidian Trench",
    subtitle: "Diving beneath the abyss of the midnight ocean",
    author: "Caspian Drake",
    coverGradient: "from-blue-900 via-indigo-950 to-slate-950",
    coverAccent: "#60A5FA",
    genre: "Sci-Fi Thriller",
    readTimeMinutes: 310,
    rating: 4.65,
    reviewsCount: 420,
    description:
      "Submersible research vessel Boreas intercepts a rhythmic acoustic signal echoing from beneath the oceanic mantle.",
    chaptersCount: 22,
    tags: ["Deep Sea", "Sci-Fi", "Suspense"],
  },
  {
    id: "story-6",
    title: "A Gentle Solitude of Ink",
    subtitle: "Reflections on letters never posted and cities left behind",
    author: "Valerie Moreau",
    coverGradient: "from-rose-900 via-zinc-900 to-neutral-950",
    coverAccent: "#FB7185",
    genre: "Literary Essays",
    readTimeMinutes: 140,
    rating: 4.88,
    reviewsCount: 1150,
    description:
      "A collection of meditative personal essays on solitary walks, paper stationery, and the art of deliberate lingering.",
    chaptersCount: 12,
    tags: ["Essays", "Poetic", "Mindfulness"],
  },
];

export const MOCK_GENRES = [
  "All Stories",
  "Celestial Fantasy",
  "Gothic Mystery",
  "Steampunk",
  "Philosophical",
  "Sci-Fi",
  "Essays & Poetry",
];

export const MOCK_READING_STATS: ReadingStats = {
  dailyGoalMinutes: 45,
  minutesReadToday: 32,
  currentStreakDays: 14,
  booksCompleted: 8,
};

export const LITERARY_QUOTES = [
  {
    quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
  },
  {
    quote: "There is no friend as loyal as a book.",
    author: "Ernest Hemingway",
  },
  {
    quote: "Words can be like X-rays if you use them properly—they’ll go through anything.",
    author: "Aldous Huxley",
  },
];
