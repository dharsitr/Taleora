import { describe, it, expect, beforeEach } from "vitest";
import { networkTelemetry } from "@/lib/network/telemetry";

describe("Network Telemetry Engine", () => {
  beforeEach(() => {
    networkTelemetry.reset();
  });

  it("should initialize with zero requests and zero active connections", () => {
    const snapshot = networkTelemetry.getSnapshot();
    expect(snapshot.totalRequests).toBe(0);
    expect(snapshot.activeHttpRequests).toBe(0);
    expect(snapshot.activeWsConnections).toBe(0);
    expect(snapshot.latency.averageMs).toBe(0);
    expect(snapshot.errors.totalErrors).toBe(0);
  });

  it("should track HTTP request lifecycle and calculate latency", () => {
    const req = new Request("http://localhost:3000/api/stories", {
      method: "GET",
      headers: { "x-forwarded-for": "192.168.1.10" },
    });

    const finish = networkTelemetry.startHttpRequest(req);
    expect(networkTelemetry.getSnapshot().activeHttpRequests).toBe(1);

    const duration = finish(200, "MISS");
    expect(duration).toBeGreaterThanOrEqual(0);

    const snapshot = networkTelemetry.getSnapshot();
    expect(snapshot.totalRequests).toBe(1);
    expect(snapshot.activeHttpRequests).toBe(0);
    expect(snapshot.latency.samplesCount).toBe(1);
    expect(snapshot.recentRequests.length).toBe(1);
    expect(snapshot.recentRequests[0].method).toBe("GET");
    expect(snapshot.recentRequests[0].path).toBe("/api/stories");
    expect(snapshot.recentRequests[0].status).toBe(200);
    expect(snapshot.recentRequests[0].cacheStatus).toBe("MISS");
  });

  it("should track API errors and compute error rates", () => {
    const req = new Request("http://localhost:3000/api/stories/secret", {
      method: "GET",
    });

    const finishSuccess = networkTelemetry.startHttpRequest(req);
    finishSuccess(200, "HIT");

    const finishErr = networkTelemetry.startHttpRequest(req);
    finishErr(404, "BYPASS", "Story not found");

    const finish500 = networkTelemetry.startHttpRequest(req);
    finish500(500, "BYPASS", "Database failure");

    const snapshot = networkTelemetry.getSnapshot();
    expect(snapshot.totalRequests).toBe(3);
    expect(snapshot.errors.totalErrors).toBe(2);
    expect(snapshot.errors.statusBreakdown[404]).toBe(1);
    expect(snapshot.errors.statusBreakdown[500]).toBe(1);
    expect(snapshot.errors.statusBreakdown[200]).toBe(1);
    expect(snapshot.errors.errorRatePercentage).toBeCloseTo(66.7, 1);
  });

  it("should manage WebSocket active connection subscriptions", () => {
    networkTelemetry.registerWsConnection();
    networkTelemetry.registerWsConnection();
    expect(networkTelemetry.getActiveWsConnections()).toBe(2);

    networkTelemetry.unregisterWsConnection();
    expect(networkTelemetry.getActiveWsConnections()).toBe(1);

    networkTelemetry.unregisterWsConnection();
    expect(networkTelemetry.getActiveWsConnections()).toBe(0);
  });

  it("should calculate cache hit ratio accurately", () => {
    const req = new Request("http://localhost:3000/api/stories", { method: "GET" });

    const f1 = networkTelemetry.startHttpRequest(req);
    f1(200, "HIT");
    const f2 = networkTelemetry.startHttpRequest(req);
    f2(200, "HIT");
    const f3 = networkTelemetry.startHttpRequest(req);
    f3(200, "MISS");

    const snapshot = networkTelemetry.getSnapshot();
    expect(snapshot.caching.hits).toBe(2);
    expect(snapshot.caching.misses).toBe(1);
    expect(snapshot.caching.hitRatioPercentage).toBeCloseTo(66.7, 1);
  });
});
