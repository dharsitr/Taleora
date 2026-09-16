/* eslint-disable react-hooks/rules-of-hooks */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationRow } from "@/types/social";

// Mock React hooks to simulate hook render lifecycle in node environment
const stateMap = new Map<number, any>();
const refMap = new Map<number, { current: any }>();
const prevDepsMap = new Map<number, any[]>();
const cleanups: (() => void)[] = [];
let hookIndex = 0;
let hasStateChanged = false;

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: vi.fn((initial: any) => {
      const id = hookIndex++;
      if (!stateMap.has(id)) {
        stateMap.set(id, typeof initial === "function" ? initial() : initial);
      }
      const setState = (valOrFn: any) => {
        const prev = stateMap.get(id);
        const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
        if (!Object.is(prev, next)) {
          stateMap.set(id, next);
          hasStateChanged = true;
        }
      };
      return [stateMap.get(id), setState];
    }),
    useRef: vi.fn((initial: any) => {
      const id = hookIndex++;
      if (!refMap.has(id)) {
        refMap.set(id, { current: initial });
      }
      return refMap.get(id);
    }),
    useEffect: vi.fn((effect: () => any, deps?: any[]) => {
      const id = hookIndex++;
      const prevDeps = prevDepsMap.get(id);
      const hasChanged =
        prevDeps === undefined ||
        deps === undefined ||
        deps.length !== prevDeps.length ||
        deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

      if (hasChanged) {
        const existingCleanup = cleanups[id];
        if (existingCleanup) {
          existingCleanup();
          cleanups[id] = undefined as any;
        }
        prevDepsMap.set(id, deps ? [...deps] : []);
        const cleanup = effect();
        if (typeof cleanup === "function") {
          cleanups[id] = cleanup;
        }
      }
    }),
  };
});

// Mock Supabase client
const mockRemoveChannel = vi.fn();
let mockChannelInstance: any = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn((channelName: string) => {
      mockChannelInstance = {
        name: channelName,
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((cb: (status: string) => void) => {
          mockChannelInstance._subscribeCallback = cb;
          cb("SUBSCRIBED");
          return mockChannelInstance;
        }),
      };
      return mockChannelInstance;
    }),
    removeChannel: mockRemoveChannel,
  })),
}));

import { useWebSocketNotifications } from "@/lib/network/websocket-notifications";

describe("WebSocket Realtime Notifications (REL-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannelInstance = null;
    stateMap.clear();
    refMap.clear();
    prevDepsMap.clear();
    for (const c of cleanups) {
      if (c) c();
    }
    cleanups.length = 0;
  });

  function createHookHarness(initialProps: {
    userId: string | null | undefined;
    onNotificationReceived?: (n: NotificationRow) => void;
    onStatusChange?: (s: string) => void;
  }) {
    let currentProps = { ...initialProps };
    let hookResult: any = null;

    const render = (nextProps?: Partial<typeof currentProps>) => {
      if (nextProps) {
        currentProps = { ...currentProps, ...nextProps };
      }
      let passes = 0;
      do {
        hasStateChanged = false;
        hookIndex = 0;
        hookResult = useWebSocketNotifications(currentProps);
        passes++;
      } while (hasStateChanged && passes < 10);

      return hookResult;
    };

    const unmount = () => {
      for (const cleanup of cleanups) {
        if (cleanup) cleanup();
      }
      cleanups.length = 0;
    };

    render();

    return {
      render,
      unmount,
      getResult: () => hookResult,
      getChannel: () => mockChannelInstance,
    };
  }

  it("subscribes to realtime notifications when userId is provided", () => {
    const harness = createHookHarness({ userId: "user-123" });
    const channel = harness.getChannel();

    expect(channel).not.toBeNull();
    expect(channel.name).toBe("realtime:user_notifications:user-123");
    expect(channel.subscribe).toHaveBeenCalled();
    expect(harness.getResult().isConnected).toBe(true);
    expect(harness.getResult().status).toBe("connected");

    harness.unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
  });

  it("remains disconnected when userId is null or undefined", () => {
    const onStatusChange = vi.fn();
    const harness = createHookHarness({
      userId: null,
      onStatusChange,
    });

    expect(harness.getResult().isConnected).toBe(false);
    expect(harness.getResult().status).toBe("disconnected");
    expect(harness.getChannel()).toBeNull();
    expect(onStatusChange).toHaveBeenCalledWith("disconnected");

    harness.unmount();
  });

  it("does NOT unsubscribe or recreate channel when callbacks change on rerender (REL-01 fix)", () => {
    const cb1 = vi.fn();
    const statusCb1 = vi.fn();

    const harness = createHookHarness({
      userId: "user-abc",
      onNotificationReceived: cb1,
      onStatusChange: statusCb1,
    });

    const initialChannel = harness.getChannel();
    expect(initialChannel).not.toBeNull();
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    // Simulate multiple re-renders passing new arrow functions (e.g. state changes in drawer)
    const cb2 = vi.fn();
    const statusCb2 = vi.fn();
    harness.render({ onNotificationReceived: cb2, onStatusChange: statusCb2 });

    const cb3 = vi.fn();
    const statusCb3 = vi.fn();
    harness.render({ onNotificationReceived: cb3, onStatusChange: statusCb3 });

    // The channel MUST NOT have been removed or re-created
    expect(mockRemoveChannel).not.toHaveBeenCalled();
    expect(harness.getChannel()).toBe(initialChannel);

    harness.unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
  });

  it("delivers incoming notification to the latest callback ref without resubscribing", () => {
    const initialCallback = vi.fn();
    const harness = createHookHarness({
      userId: "user-456",
      onNotificationReceived: initialCallback,
    });

    const channel = harness.getChannel();
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "user_id=eq.user-456",
      },
      expect.any(Function)
    );

    // Extract the event listener registered with Supabase Realtime
    const onCall = channel.on.mock.calls[0];
    const eventHandler = onCall[2];

    // Rerender with a NEW callback (simulating drawer state update)
    const updatedCallback = vi.fn();
    harness.render({ onNotificationReceived: updatedCallback });

    // Simulate an incoming notification event from WebSocket
    const mockNotification: NotificationRow = {
      id: "notif-999",
      user_id: "user-456",
      actor_id: "actor-1",
      type: "review_like",
      title: "New Like",
      message: "Someone liked your review",
      link: "/books/test",
      is_read: false,
      created_at: new Date().toISOString(),
    };

    eventHandler({ new: mockNotification });

    // Updated callback should be called, old callback should not
    expect(updatedCallback).toHaveBeenCalledTimes(1);
    expect(updatedCallback).toHaveBeenCalledWith(mockNotification);
    expect(initialCallback).not.toHaveBeenCalled();

    // Re-render to observe state update
    harness.render();
    expect(harness.getResult().liveNotifications).toContainEqual(mockNotification);

    harness.unmount();
  });

  it("properly unsubscribes and creates new channel when userId changes", () => {
    const harness = createHookHarness({ userId: "user-1" });
    expect(harness.getChannel().name).toBe("realtime:user_notifications:user-1");

    // Change user
    harness.render({ userId: "user-2" });

    // Old channel removed, new channel subscribed
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    expect(harness.getChannel().name).toBe("realtime:user_notifications:user-2");

    harness.unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });
});
