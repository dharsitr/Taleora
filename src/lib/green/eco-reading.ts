/**
 * Green Reading System & Sustainability Telemetry Engine for Taleora.
 * 
 * Core Green Computing Pillars:
 * 1. Payload Minimization: Cache chapters to eliminate redundant network hops.
 * 2. Energy-Efficient Rendering: Fallback to lightweight 2D reader in Eco Mode,
 *    stopping the high-power 60 FPS WebGL/Three.js GPU render loop.
 * 3. Lazy Resource Loading: Defer heavy cover artwork & decorative media until needed.
 * 4. Transparent Telemetry: Report actual measured network requests and transfer bytes,
 *    and clearly labeled estimated bytes saved. No unverified electricity/carbon claims.
 */

import { ChapterReaderData } from "@/types/books";

export interface SustainabilityMetrics {
  cacheHits: number;
  networkRequestsAvoided: number;
  totalDataTransferredBytes: number;
  estimatedDataSavedBytes: number;
  totalRequests: number;
  ecoModeActive: boolean;
  dataSaverDetected?: boolean;
  lowBatteryDetected?: boolean;
  lastUpdated: number;
}

const DEFAULT_METRICS: SustainabilityMetrics = {
  cacheHits: 0,
  networkRequestsAvoided: 0,
  totalDataTransferredBytes: 0,
  estimatedDataSavedBytes: 0,
  totalRequests: 0,
  ecoModeActive: false,
  dataSaverDetected: false,
  lowBatteryDetected: false,
  lastUpdated: Date.now(),
};

const METRICS_STORAGE_KEY = "taleora-sustainability-metrics";
const CHAPTER_CACHE_PREFIX = "taleora-eco-chapter:";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// In-memory cache store (fast lookup during active reading session)
interface CacheEntry {
  data: ChapterReaderData;
  timestamp: number;
  estimatedSizeBytes: number;
}

class GreenReadingEngine {
  private memoryCache = new Map<string, CacheEntry>();
  private metrics: SustainabilityMetrics = { ...DEFAULT_METRICS };
  private listeners = new Set<() => void>();

  constructor() {
    this.initFromStorage();
    this.setupWindowListeners();
    this.checkEnvironmentalTriggers();
  }

  private initFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(METRICS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.metrics = {
          ...DEFAULT_METRICS,
          ...parsed,
          lastUpdated: Date.now(),
        };
      }
    } catch {
      // Storage unavailable or blocked
    }
  }

  private saveMetricsToStorage() {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(this.metrics));
    } catch {
      // Storage quota or privacy mode error
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in sustainability metrics listener:", err);
      }
    });
  }

  private setupWindowListeners() {
    if (typeof window === "undefined") return;
    window.addEventListener("taleora-cache-invalidated", ((
      event: CustomEvent<{ bookSlug?: string; chapterSlug?: string }>
    ) => {
      const detail = event.detail || {};
      this.invalidate(detail.bookSlug, detail.chapterSlug);
    }) as EventListener);
  }

  /**
   * Subscribe to metrics updates for reactive UI components.
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get a snapshot of current sustainability metrics.
   */
  public getMetrics(): SustainabilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Toggle or set Eco Reading Mode status.
   */
  public setEcoModeActive(active: boolean) {
    if (this.metrics.ecoModeActive !== active) {
      this.metrics.ecoModeActive = active;
      this.metrics.lastUpdated = Date.now();
      this.saveMetricsToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Set environmental trigger flags manually (for testing or overrides).
   */
  public setEnvironmentalTriggers(triggers: { dataSaver?: boolean; lowBattery?: boolean }) {
    if (triggers.dataSaver !== undefined) {
      this.metrics.dataSaverDetected = triggers.dataSaver;
      if (triggers.dataSaver) this.metrics.ecoModeActive = true;
    }
    if (triggers.lowBattery !== undefined) {
      this.metrics.lowBatteryDetected = triggers.lowBattery;
      if (triggers.lowBattery) this.metrics.ecoModeActive = true;
    }
    this.metrics.lastUpdated = Date.now();
    this.saveMetricsToStorage();
    this.notifyListeners();
  }

  /**
   * Check client hardware & network constraints (Data-Saver, Low Battery).
   */
  public checkEnvironmentalTriggers(): { dataSaver: boolean; lowBattery: boolean } {
    if (typeof window === "undefined") {
      return {
        dataSaver: Boolean(this.metrics.dataSaverDetected),
        lowBattery: Boolean(this.metrics.lowBatteryDetected),
      };
    }

    let changed = false;

    // 1. Network Data Saver API (navigator.connection.saveData)
    try {
      const navConn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      if (navConn?.saveData === true) {
        if (!this.metrics.dataSaverDetected) {
          this.metrics.dataSaverDetected = true;
          this.metrics.ecoModeActive = true; // Auto-engage eco mode to minimize payload
          changed = true;
        }
      }
    } catch {
      // Ignored if API unsupported
    }

    // 2. Battery Status API (navigator.getBattery)
    try {
      const navBattery = navigator as unknown as {
        getBattery?: () => Promise<{ level: number; charging: boolean; addEventListener?: (t: string, cb: () => void) => void }>;
      };
      if (typeof navBattery.getBattery === "function") {
        navBattery.getBattery().then((battery) => {
          if (battery && battery.level <= 0.2 && !battery.charging) {
            if (!this.metrics.lowBatteryDetected) {
              this.metrics.lowBatteryDetected = true;
              this.metrics.ecoModeActive = true;
              this.saveMetricsToStorage();
              this.notifyListeners();
            }
          }
        }).catch(() => {});
      }
    } catch {
      // Ignored if battery API unsupported
    }

    if (changed) {
      this.metrics.lastUpdated = Date.now();
      this.saveMetricsToStorage();
      this.notifyListeners();
    }

    return {
      dataSaver: Boolean(this.metrics.dataSaverDetected),
      lowBattery: Boolean(this.metrics.lowBatteryDetected),
    };
  }

  /**
   * Estimate the payload size in bytes for a chapter payload.
   */
  public estimatePayloadSize(data: ChapterReaderData): number {
    try {
      const serialized = JSON.stringify(data);
      return new TextEncoder().encode(serialized).length;
    } catch {
      // Fallback: estimate from text content lengths
      const contentLen = data.currentChapter?.content?.length || 0;
      const titleLen = (data.currentChapter?.title?.length || 0) + (data.book?.title?.length || 0);
      return Math.round(contentLen + titleLen + 1024); // Content + metadata estimate
    }
  }

  /**
   * Record a network request fetch and its actual measurable transferred bytes.
   */
  public recordNetworkFetch(bytesTransferred: number) {
    this.metrics.totalRequests += 1;
    this.metrics.totalDataTransferredBytes += Math.max(0, bytesTransferred);
    this.metrics.lastUpdated = Date.now();
    this.saveMetricsToStorage();
    this.notifyListeners();
  }

  /**
   * Record a cache hit where a network roundtrip was avoided.
   */
  public recordCacheHit(estimatedBytesSaved: number) {
    this.metrics.cacheHits += 1;
    this.metrics.networkRequestsAvoided += 1;
    this.metrics.estimatedDataSavedBytes += Math.max(0, estimatedBytesSaved);
    this.metrics.lastUpdated = Date.now();
    this.saveMetricsToStorage();
    this.notifyListeners();
  }

  /**
   * Reset all sustainability metrics (e.g. for testing or fresh reading session).
   */
  public resetMetrics() {
    this.metrics = {
      ...DEFAULT_METRICS,
      ecoModeActive: this.metrics.ecoModeActive, // retain preference
      lastUpdated: Date.now(),
    };
    this.saveMetricsToStorage();
    this.notifyListeners();
  }

  /**
   * Normalizes cache keys for chapters.
   */
  private buildKey(bookSlug: string, chapterSlug?: string): string {
    const safeBook = encodeURIComponent((bookSlug || "").trim().toLowerCase());
    const safeChapter = encodeURIComponent((chapterSlug || "first").trim().toLowerCase());
    return `${CHAPTER_CACHE_PREFIX}${safeBook}:${safeChapter}`;
  }

  /**
   * Get cached chapter data if valid and fresh.
   */
  public get(bookSlug: string, chapterSlug?: string): ChapterReaderData | null {
    const key = this.buildKey(bookSlug, chapterSlug);
    const now = Date.now();

    // 1. Check memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (now - memoryEntry.timestamp < CACHE_TTL_MS) {
        this.recordCacheHit(memoryEntry.estimatedSizeBytes);
        return memoryEntry.data;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check session storage
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry;
          if (now - parsed.timestamp < CACHE_TTL_MS) {
            // Restore to memory cache for sub-millisecond future lookups
            this.memoryCache.set(key, parsed);
            this.recordCacheHit(parsed.estimatedSizeBytes);
            return parsed.data;
          }
          sessionStorage.removeItem(key);
        }
      } catch {
        // Ignore session storage error
      }
    }

    return null;
  }

  /**
   * Cache chapter data with estimated byte size.
   */
  public set(
    bookSlug: string,
    chapterSlug: string | undefined,
    data: ChapterReaderData
  ) {
    // Only cache if chapter is published and valid
    if (!data || !data.currentChapter || data.currentChapter.status !== "published") {
      return;
    }

    const key = this.buildKey(bookSlug, chapterSlug);
    const estimatedSizeBytes = this.estimatePayloadSize(data);

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      estimatedSizeBytes,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in session storage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(key, JSON.stringify(entry));
      } catch {
        // If quota exceeded, clear older session items
        this.pruneOldSessionEntries();
      }
    }
  }

  /**
   * Invalidate specific chapter, book chapters, or all green reading caches.
   */
  public invalidate(bookSlug?: string, chapterSlug?: string) {
    if (!bookSlug) {
      this.memoryCache.clear();
      if (typeof window !== "undefined") {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(CHAPTER_CACHE_PREFIX)) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => sessionStorage.removeItem(k));
        } catch {
          // Ignore
        }
      }
      return;
    }

    const prefix = chapterSlug
      ? this.buildKey(bookSlug, chapterSlug)
      : `${CHAPTER_CACHE_PREFIX}${encodeURIComponent(bookSlug.trim().toLowerCase())}:`;

    for (const key of Array.from(this.memoryCache.keys())) {
      if (key === prefix || key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && (k === prefix || k.startsWith(prefix))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  }

  private pruneOldSessionEntries() {
    if (typeof window === "undefined") return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(CHAPTER_CACHE_PREFIX)) {
          keys.push(k);
        }
      }
      // Remove half of the stored chapters
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => {
        sessionStorage.removeItem(k);
      });
    } catch {
      // Ignore
    }
  }
}

// Global singleton instance
const globalForGreen = globalThis as unknown as {
  taleoraGreenReadingEngine?: GreenReadingEngine;
};

export const greenReadingEngine =
  globalForGreen.taleoraGreenReadingEngine ||
  (globalForGreen.taleoraGreenReadingEngine = new GreenReadingEngine());

/**
 * Format bytes into human-readable units (B, KB, MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Broadcast cache invalidation across the app.
 */
export function dispatchCacheInvalidation(bookSlug?: string, chapterSlug?: string) {
  greenReadingEngine.invalidate(bookSlug, chapterSlug);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("taleora-cache-invalidated", {
        detail: { bookSlug, chapterSlug },
      })
    );
  }
}
