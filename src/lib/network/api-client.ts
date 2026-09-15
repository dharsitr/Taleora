/**
 * Resilient Client-Side HTTP/REST Transport for Taleora.
 * Incorporates Computer Networks mechanics:
 * - Configurable Request Timeouts via AbortController
 * - Exponential Backoff with Random Jitter on Transient Failures
 * - Client-Side ETag Validation with Conditional Requests (If-None-Match)
 * - Transparent Error Classification (Timeout, Offline, RateLimited, ServerError)
 * - Network Latency Measurement
 */

export class NetworkTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Network request timed out after ${timeoutMs}ms.`);
    this.name = "NetworkTimeoutError";
  }
}

export class NetworkOfflineError extends Error {
  constructor() {
    super("Network unreachable. Please check your internet connection.");
    this.name = "NetworkOfflineError";
  }
}

export class RateLimitError extends Error {
  public retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, message?: string) {
    super(message || `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ApiError extends Error {
  public status: number;
  public details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  useETagCache?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  status: number;
  ok: boolean;
  cached: boolean;
  latencyMs: number;
  error?: string;
  details?: unknown;
}

// Client-side ETag and response cache
interface ClientCacheEntry {
  etag: string;
  data: unknown;
}
const clientETagCache = new Map<string, ClientCacheEntry>();

/**
 * Resilient HTTP client instance.
 */
export class TaleoraApiClient {
  private defaultTimeout = 8000;
  private defaultRetries = 2;

  /**
   * Execute fetch with timeout, retry, and ETag handling.
   */
  public async request<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeoutMs = this.defaultTimeout,
      retries = options.method && options.method !== "GET" ? 0 : this.defaultRetries,
      retryDelayMs = 400,
      useETagCache = options.method === undefined || options.method === "GET",
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    // Check client network connectivity
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new NetworkOfflineError();
    }

    const headers = new Headers(customHeaders);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    // Attach ETag if present in client cache
    const cachedEntry = useETagCache ? clientETagCache.get(url) : undefined;
    if (cachedEntry && cachedEntry.etag) {
      headers.set("If-None-Match", cachedEntry.etag);
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        // HTTP 304 Not Modified: Reuse cached data!
        if (response.status === 304 && cachedEntry) {
          return {
            data: cachedEntry.data as T,
            status: 304,
            ok: true,
            cached: true,
            latencyMs,
          };
        }

        // HTTP 429 Too Many Requests
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
          const errData = await response.json().catch(() => ({}));
          throw new RateLimitError(
            retryAfter,
            errData.message || `Rate limit exceeded. Retry in ${retryAfter}s.`
          );
        }

        // Extract response JSON or text
        const responseText = await response.text();
        let parsedData: unknown = null;
        try {
          parsedData = responseText ? JSON.parse(responseText) : null;
        } catch {
          parsedData = responseText;
        }

        if (!response.ok) {
          const errMessage =
            (parsedData && typeof parsedData === "object" && "error" in parsedData
              ? String((parsedData as Record<string, unknown>).error)
              : null) ||
            response.statusText ||
            `HTTP ${response.status}`;

          // Only retry transient 5xx server errors for idempotent GET requests
          if (response.status >= 500 && attempt < retries && (!options.method || options.method === "GET")) {
            throw new Error(`Server error ${response.status}`);
          }

          return {
            data: null,
            status: response.status,
            ok: false,
            cached: false,
            latencyMs,
            error: errMessage,
            details: parsedData,
          };
        }

        // Cache response ETag if present
        const responseETag = response.headers.get("ETag");
        if (useETagCache && responseETag && parsedData) {
          clientETagCache.set(url, {
            etag: responseETag,
            data: parsedData,
          });
        }

        return {
          data: parsedData as T,
          status: response.status,
          ok: true,
          cached: response.headers.get("X-Cache") === "HIT",
          latencyMs,
        };
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError = err;

        // Check if aborted due to timeout
        if (err instanceof DOMException && err.name === "AbortError") {
          lastError = new NetworkTimeoutError(timeoutMs);
        }

        // Rate limit errors should not be automatically retried
        if (err instanceof RateLimitError) {
          throw err;
        }

        // Retry if within limit
        if (attempt < retries) {
          attempt += 1;
          // Exponential backoff with random jitter (e.g. 400ms * 2^1 + 0..100ms)
          const backoff = Math.min(3000, retryDelayMs * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 100);
          await new Promise((res) => setTimeout(res, backoff + jitter));
          continue;
        }

        break;
      }
    }

    // If we exhausted retries, throw or return standard error response
    if (lastError instanceof NetworkTimeoutError || lastError instanceof NetworkOfflineError) {
      throw lastError;
    }

    const errMsg = lastError instanceof Error ? lastError.message : "Network request failed";
    return {
      data: null,
      status: 0,
      ok: false,
      cached: false,
      latencyMs: 0,
      error: errMsg,
    };
  }

  public get<T = unknown>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  public post<T = unknown>(url: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
    });
  }

  public put<T = unknown>(url: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
    });
  }

  public delete<T = unknown>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export const apiClient = new TaleoraApiClient();
