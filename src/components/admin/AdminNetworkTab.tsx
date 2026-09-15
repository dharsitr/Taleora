"use client";

import * as React from "react";
import {
  Activity,
  Zap,
  Radio,
  Clock,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowDownRight,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { NetworkMetricsData, RequestLogEntry } from "@/lib/network/telemetry";

export function AdminNetworkTab() {
  const [metrics, setMetrics] = React.useState<NetworkMetricsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [selectedMethod, setSelectedMethod] = React.useState<string>("ALL");
  const [resetMessage, setResetMessage] = React.useState<string | null>(null);

  const fetchMetrics = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/network-metrics", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load network telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling interval
  React.useEffect(() => {
    fetchMetrics();
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const handleResetMetrics = async () => {
    if (!confirm("Reset all network telemetry counters?")) return;
    try {
      const res = await fetch("/api/admin/network-metrics", { method: "POST" });
      if (res.ok) {
        setResetMessage("Counters reset");
        fetchMetrics();
        setTimeout(() => setResetMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to reset metrics:", err);
    }
  };

  const filteredLogs = React.useMemo(() => {
    if (!metrics?.recentRequests) return [];
    if (selectedMethod === "ALL") return metrics.recentRequests;
    return metrics.recentRequests.filter((r) => r.method === selectedMethod);
  }, [metrics?.recentRequests, selectedMethod]);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-serif">
          Querying Network Telemetry Engine...
        </span>
      </div>
    );
  }

  const latencyAvg = metrics?.latency.averageMs ?? 0;
  const latencyP95 = metrics?.latency.p95Ms ?? 0;
  const throughputRpm = metrics?.throughput.requestsPerMinute ?? 0;
  const activeHttp = metrics?.activeHttpRequests ?? 0;
  const activeWs = metrics?.activeWsConnections ?? 0;
  const errorRate = metrics?.errors.errorRatePercentage ?? 0;
  const hitRatio = metrics?.caching.hitRatioPercentage ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Network Overview Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                Taleora Network Telemetry & Infrastructure Monitor
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspecting client-server REST APIs, WebSocket channels, ETag caching, and connection queues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs gap-1.5 cursor-pointer ${
              autoRefresh ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : ""
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            <span>{autoRefresh ? "Auto (3s)" : "Paused"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="text-xs gap-1.5 cursor-pointer"
            title="Refresh snapshot immediately"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Poll</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMetrics}
            className="text-xs gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
            title="Reset telemetry counters"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {resetMessage && (
        <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Network KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latency Card */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Request Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {latencyAvg}
            </span>
            <span className="text-xs text-muted-foreground font-mono">ms avg</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>P95: <strong className="font-mono text-foreground">{latencyP95}ms</strong></span>
            <span>Samples: <strong className="font-mono text-foreground">{metrics?.latency.samplesCount ?? 0}</strong></span>
          </div>
        </div>

        {/* Throughput Card */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Network Throughput
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {throughputRpm}
            </span>
            <span className="text-xs text-muted-foreground font-mono">req / min</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Rate: <strong className="font-mono text-foreground">{metrics?.throughput.requestsPerSecond ?? 0}/s</strong></span>
            <span>Total: <strong className="font-mono text-foreground">{metrics?.totalRequests ?? 0}</strong></span>
          </div>
        </div>

        {/* Active Connections */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Connections
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {activeHttp + activeWs}
            </span>
            <span className="text-xs text-muted-foreground font-mono">open</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>HTTP In-Flight: <strong className="font-mono text-foreground">{activeHttp}</strong></span>
            <span>WebSocket: <strong className="font-mono text-foreground">{activeWs}</strong></span>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cache Hit Ratio
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {hitRatio}%
            </span>
            <span className="text-xs text-muted-foreground font-mono">ETag / LRU</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Hits: <strong className="font-mono text-emerald-500">{metrics?.caching.hits ?? 0}</strong></span>
            <span>Misses: <strong className="font-mono text-muted-foreground">{metrics?.caching.misses ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Network Health & Error Breakdown Banner */}
      <div className="p-5 rounded-2xl border border-border/80 bg-secondary/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                errorRate > 10
                  ? "bg-rose-500/15 text-rose-500"
                  : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              {errorRate > 10 ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Network Error Rate: {errorRate}%
              </h4>
              <p className="text-xs text-muted-foreground">
                Total Errors: {metrics?.errors.totalErrors ?? 0} · 429 Rate Throttles:{" "}
                {metrics?.errors.throttledRequests429 ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {metrics?.errors.statusBreakdown &&
              Object.entries(metrics.errors.statusBreakdown).map(([status, count]) => {
                const s = Number(status);
                const color =
                  s >= 500
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                    : s === 429
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : s >= 400
                    ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                    : s === 304
                    ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
                return (
                  <span
                    key={status}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border ${color}`}
                  >
                    HTTP {status}: {count}
                  </span>
                );
              })}
          </div>
        </div>
      </div>

      {/* Live Request Stream / Inspector Table */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Live REST API & Network Request Stream</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time ring buffer showing the last {metrics?.recentRequests.length || 0} HTTP interactions.
            </p>
          </div>

          {/* Filter by Method */}
          <div className="flex items-center gap-1.5">
            {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  selectedMethod === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground font-mono text-[11px] border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Endpoint Path</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Cache</th>
                <th className="py-3 px-4">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans">
                    No requests recorded yet. Browse Taleora stories or studio to generate traffic!
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const methodColors: Record<string, string> = {
                    GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    POST: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    DELETE: "bg-rose-500/10 text-rose-500 border-rose-500/20",
                  };

                  const statusColors =
                    entry.status >= 500
                      ? "text-rose-500"
                      : entry.status === 429
                      ? "text-amber-500"
                      : entry.status >= 400
                      ? "text-orange-500"
                      : entry.status === 304
                      ? "text-purple-500"
                      : "text-emerald-500";

                  const timeStr = new Date(entry.timestamp).toLocaleTimeString();

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground">{timeStr}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            methodColors[entry.method] || "bg-secondary text-foreground"
                          }`}
                        >
                          {entry.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-foreground max-w-xs truncate">
                        {entry.path}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={statusColors}>{entry.status}</span>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {entry.durationMs}ms
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            entry.cacheStatus === "HIT"
                              ? "bg-emerald-500/10 text-emerald-500 font-semibold"
                              : entry.cacheStatus === "MISS"
                              ? "bg-amber-500/10 text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {entry.cacheStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[10px]">
                        {entry.clientHash}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
