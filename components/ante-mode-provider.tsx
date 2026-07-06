"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { anteEnvironmentFromKey } from "@/lib/ante-env";
import {
  type AnteCredentialMode,
  ANTE_KEY_MODE_HEADER,
  modeLabel,
  parseAnteCredentialMode,
} from "@/lib/ante-credential-mode";

const STORAGE_KEY = "ante-demo-key-mode";

type AnteModeProviderProps = {
  merchantId: string;
  testPublishableKey: string;
  livePublishableKey: string;
  children: ReactNode;
};

type AnteModeContextValue = {
  merchantId: string;
  mode: AnteCredentialMode;
  setMode: (mode: AnteCredentialMode) => void;
  publishableKey: string;
  environment: "sandbox" | "production";
  hasTestKey: boolean;
  hasLiveKey: boolean;
  modeHeaders: Record<string, string>;
  /** True after a network-level failure reaching splitante.com — routes the SDK
   *  through the app's vercel.app alias (some DNS filters block new domains). */
  apiFallback: boolean;
  enableApiFallback: () => void;
};

const AnteModeContext = createContext<AnteModeContextValue | null>(null);

function defaultMode(hasTest: boolean, hasLive: boolean): AnteCredentialMode {
  if (hasTest) return "sandbox";
  if (hasLive) return "live";
  return "sandbox";
}

export function AnteModeProvider({
  merchantId,
  testPublishableKey,
  livePublishableKey,
  children,
}: AnteModeProviderProps) {
  const hasTestKey = Boolean(testPublishableKey);
  const hasLiveKey = Boolean(livePublishableKey);

  const [mode, setModeState] = useState<AnteCredentialMode>(() =>
    defaultMode(hasTestKey, hasLiveKey),
  );
  const [apiFallback, setApiFallback] = useState(false);
  const enableApiFallback = useCallback(() => setApiFallback(true), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = parseAnteCredentialMode(stored);
      if (parsed === "live" && hasLiveKey) setModeState("live");
      if (parsed === "sandbox" && hasTestKey) setModeState("sandbox");
    } catch {
      /* ignore */
    }
  }, [hasLiveKey, hasTestKey]);

  const setMode = useCallback(
    (next: AnteCredentialMode) => {
      if (next === "live" && !hasLiveKey) return;
      if (next === "sandbox" && !hasTestKey) return;
      setModeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [hasLiveKey, hasTestKey],
  );

  const publishableKey = mode === "live" ? livePublishableKey : testPublishableKey;

  const value = useMemo<AnteModeContextValue>(
    () => ({
      merchantId,
      mode,
      setMode,
      publishableKey,
      environment: anteEnvironmentFromKey(publishableKey),
      hasTestKey,
      hasLiveKey,
      modeHeaders: { [ANTE_KEY_MODE_HEADER]: mode },
      apiFallback,
      enableApiFallback,
    }),
    [merchantId, mode, setMode, publishableKey, hasTestKey, hasLiveKey, apiFallback, enableApiFallback],
  );

  return <AnteModeContext.Provider value={value}>{children}</AnteModeContext.Provider>;
}

export function useAnteMode() {
  const context = useContext(AnteModeContext);
  if (!context) {
    throw new Error("useAnteMode must be used within AnteModeProvider");
  }
  return context;
}

export { modeLabel };
