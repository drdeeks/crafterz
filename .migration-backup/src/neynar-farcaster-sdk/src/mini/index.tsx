"use client";

import { useEffect } from "react";

export function useInitializeFarcasterApp() {
  useEffect(() => {
    const initialize = async () => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        const sdkModule = await import("@farcaster/miniapp-sdk");
        await sdkModule.sdk?.actions?.ready?.();
      } catch {
        // Running outside a Farcaster client is valid in local development.
      }
    };

    void initialize();
  }, []);
}

export function InitializeFarcasterMiniApp() {
  return null;
}
