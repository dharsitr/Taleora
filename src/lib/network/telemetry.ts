/**
 * Network Telemetry Engine for Taleora.
 * Collects and aggregates real-time metrics across all API routes,
 * client-server communications, and active WebSocket connections:
 * - Request Latency (Min, Max, Avg, P95)
 * - Throughput (Requests per second/minute over sliding windows)
 * - Active Connections (In-flight HTTP requests + active WebSocket subscriptions)
 * - API Error Rates (4xx, 5xx, 429 breakdown)
 * - Cache Hit / Miss Ratios
 * - Ring Buffer of Recent Request Logs
 */

import { NextRequest, NextResponse } from "next/server";

export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  cacheStatus: "HIT" | "MISS" | "BYPASS";
  clientHash: string;
  errorMessage?: string;
}

export interface NetworkMetricsData {
  uptimeSeconds: number;
  totalRequests: number;
  activeHttpRequests: number;
  activeWsConnections: number;
  throughput: {
    requestsPerMinute: number;
    requestsPerSecond: number;
    windowMinutes: number;
  };
  latency: {
    averageMs: number;
    p95Ms: number;
    minMs: number;
    maxMs: number;
    samplesCount: number;
  };
  errors: {
    totalErrors: number;
    errorRatePercentage: number;
    statusBreakdown: Record<number, number>;
    throttledRequests429: number;
  };
  caching: {
    hits: number;
    misses: number;
    hitRatioPercentage: number;
  };
  recentRequests: RequestLogEntry[];
}

class NetworkTelemetryCollector {
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private activeHttpRequests: number = 0;
  private activeWsConnections: number = 0;

  // Latency tracking (samples ring buffer up to 1000)
  private readonly MAX_LATENCY_SAMPLES = 1000;
  private latencySamples: number[] = [];

  // Throughput tracking (timestamps of last 1000 requests)
  private readonly MAX_THROUGHPUT_TIMESTAMPS = 2000;
  private requestTimestamps: number[] = [];

  // Error tracking
  private totalErrors: number = 0;
  private statusBreakdown: Map<number, number> = new Map();
  private throttledCount: number = 0;

  // Cache stats
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Recent requests ring buffer
  private readonly MAX_LOG_ENTRIES = 60;
  private recentRequests: RequestLogEntry[] = [];

  /**
   * Register the start of an HTTP request.
   * Returns a function to complete the request measurement.
   */
  public startHttpRequest(req: NextRequest | Request) {
    this.totalRequests += 1;
    this.activeHttpRequests += 1;
    const startTime = performance.now();
    const now = Date.now();

    // Throughput window tracking
    this.requestTimestamps.push(now);
    if (this.requestTimestamps.length > this.MAX_THROUGHPUT_TIMESTAMPS) {
      this.requestTimestamps.shift();
    }

    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    // Mask client IP for privacy
    const rawIp =
      (req instanceof NextRequest ? req.headers.get("x-forwarded-for") : null) ||
      "127.0.0.1";
    const clientHash = this.hashClient(rawIp);

    return (status: number, cacheStatus: "HIT" | "MISS" | "BYPASS" = "BYPASS", errorMsg?: string) => {
      const durationMs = Math.round(performance.now() - startTime);
      this.activeHttpRequests = Math.max(0, this.activeHttpRequests - 1);

      // Record latency
      this.recordLatency(durationMs);

      // Record errors & status codes
      this.recordStatus(status);

      // Record cache status
      if (cacheStatus === "HIT") this.cacheHits += 1;
      if (cacheStatus === "MISS") this.cacheMisses += 1;

      // Add to recent request log
      const logEntry: RequestLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        method,
        path,
        status,
        durationMs,
        cacheStatus,
        clientHash,
        errorMessage: errorMsg,
      };

      this.recentRequests.unshift(logEntry);
      if (this.recentRequests.length > this.MAX_LOG_ENTRIES) {
        this.recentRequests.pop();
      }

      return durationMs;
    };
  }

  /**
   * Record a latency sample.
   */
  private recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > this.MAX_LATENCY_SAMPLES) {
      this.latencySamples.shift();
    }
  }

  /**
   * Record HTTP status code.
   */
  private recordStatus(status: number) {
    const current = this.statusBreakdown.get(status) || 0;
    this.statusBreakdown.set(status, current + 1);

    if (status >= 400) {
      this.totalErrors += 1;
    }
    if (status === 429) {
      this.throttledCount += 1;
    }
  }

  /**
   * WebSocket active connection management.
   */
  public registerWsConnection() {
    this.activeWsConnections += 1;
  }

  public unregisterWsConnection() {
    this.activeWsConnections = Math.max(0, this.activeWsConnections - 1);
  }

  public getActiveWsConnections(): number {
    return this.activeWsConnections;
  }

  /**
   * Calculate 95th percentile latency.
   */
  private calculateP95(): number {
    if (this.latencySamples.length === 0) return 0;
    const sorted = [...this.latencySamples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Hash client IP address for privacy while maintaining correlation.
   */
  private hashClient(ip: string): string {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash |= 0;
    }
    return `client_${Math.abs(hash).toString(16).slice(0, 6)}`;
  }

  /**
   * Compute rolling throughput (requests/min and requests/sec).
   */
  private computeThroughput() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const recentCount = this.requestTimestamps.filter((t) => t >= oneMinuteAgo).length;

    return {
      requestsPerMinute: recentCount,
      requestsPerSecond: parseFloat((recentCount / 60).toFixed(2)),
      windowMinutes: 1,
    };
  }

  /**
   * Export complete snapshot of current network metrics.
   */
  public getSnapshot(): NetworkMetricsData {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const samplesCount = this.latencySamples.length;
    const sum = this.latencySamples.reduce((acc, val) => acc + val, 0);
    const averageMs = samplesCount > 0 ? parseFloat((sum / samplesCount).toFixed(1)) : 0;
    const minMs = samplesCount > 0 ? Math.min(...this.latencySamples) : 0;
    const maxMs = samplesCount > 0 ? Math.max(...this.latencySamples) : 0;
    const p95Ms = this.calculateP95();

    const totalTrackedRequests = this.totalRequests;
    const errorRatePercentage =
      totalTrackedRequests > 0
        ? parseFloat(((this.totalErrors / totalTrackedRequests) * 100).toFixed(1))
        : 0;

    const totalCacheEvents = this.cacheHits + this.cacheMisses;
    const hitRatioPercentage =
      totalCacheEvents > 0
        ? parseFloat(((this.cacheHits / totalCacheEvents) * 100).toFixed(1))
        : 0;

    const statusObj: Record<number, number> = {};
    for (const [code, count] of this.statusBreakdown.entries()) {
      statusObj[code] = count;
    }

    return {
      uptimeSeconds,
      totalRequests: totalTrackedRequests,
      activeHttpRequests: this.activeHttpRequests,
      activeWsConnections: this.activeWsConnections,
      throughput: this.computeThroughput(),
      latency: {
        averageMs,
        p95Ms,
        minMs,
        maxMs,
        samplesCount,
      },
      errors: {
        totalErrors: this.totalErrors,
        errorRatePercentage,
        statusBreakdown: statusObj,
        throttledRequests429: this.throttledCount,
      },
      caching: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRatioPercentage,
      },
      recentRequests: [...this.recentRequests],
    };
  }

  /**
   * Reset telemetry counters (admin action).
   */
  public reset() {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.activeHttpRequests = 0;
    this.latencySamples = [];
    this.requestTimestamps = [];
    this.totalErrors = 0;
    this.statusBreakdown.clear();
    this.throttledCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.recentRequests = [];
  }
}

// Global singleton instance across server runtime
const globalForTelemetry = globalThis as unknown as {
  taleoraNetworkTelemetry?: NetworkTelemetryCollector;
};

export const networkTelemetry =
  globalForTelemetry.taleoraNetworkTelemetry ||
  (globalForTelemetry.taleoraNetworkTelemetry = new NetworkTelemetryCollector());

/**
 * Route handler wrapper to automatically record network telemetry and response time headers.
 */
export async function withNetworkTelemetry(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const completeMeasure = networkTelemetry.startHttpRequest(req);
  let status = 500;
  let cacheStatus: "HIT" | "MISS" | "BYPASS" = "BYPASS";

  try {
    const res = await handler();
    status = res.status;

    const cacheHeader = res.headers.get("X-Cache");
    if (cacheHeader === "HIT") cacheStatus = "HIT";
    else if (cacheHeader === "MISS") cacheStatus = "MISS";

    const duration = completeMeasure(status, cacheStatus);
    res.headers.set("X-Response-Time", `${duration}ms`);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    completeMeasure(500, "BYPASS", message);
    throw err;
  }
}
