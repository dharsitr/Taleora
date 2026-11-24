import { describe, it, expect, beforeAll } from "vitest";

describe("Strict Real-Time Streak Calculation", () => {
  let calculateStreaks: (dates: string[]) => { currentStreak: number; longestStreak: number };

  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
    const mod = await import("@/lib/stats/queries");
    calculateStreaks = mod.calculateStreaks;
  });

  const formatYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  it("returns 0 if user has no reading history", () => {
    expect(calculateStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("returns 0 if user has not read today and has not read yesterday", () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    expect(calculateStreaks([formatYmd(twoDaysAgo), formatYmd(threeDaysAgo)])).toEqual({
      currentStreak: 0,
      longestStreak: 1, // 2 consecutive days in past = streak of 1
    });
  });

  it("returns streak 0 if user just started reading today (1 day only)", () => {
    const today = new Date();
    const res = calculateStreaks([formatYmd(today)]);
    expect(res.currentStreak).toBe(0);
  });

  it("returns streak 1 when user read yesterday AND today (2 consecutive days)", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const res = calculateStreaks([formatYmd(today), formatYmd(yesterday)]);
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(1);
  });

  it("returns streak 2 when user read 3 consecutive days", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const res = calculateStreaks([formatYmd(today), formatYmd(yesterday), formatYmd(twoDaysAgo)]);
    expect(res.currentStreak).toBe(2);
    expect(res.longestStreak).toBe(2);
  });

  it("resets currentStreak to 0 if 1 full calendar day is skipped", () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const res = calculateStreaks([formatYmd(today), formatYmd(twoDaysAgo), formatYmd(threeDaysAgo)]);
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(1);
  });
});
