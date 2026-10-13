"use client";

import * as React from "react";

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl && window.WebGLRenderingContext);
  } catch {
    return false;
  }
}

export function useWebGLSupport() {
  const [isSupported, setIsSupported] = React.useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState<boolean>(false);
  const [isClient, setIsClient] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsClient(true);
    setIsSupported(isWebGLAvailable());

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);
    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return { isSupported, prefersReducedMotion, isClient };
}
