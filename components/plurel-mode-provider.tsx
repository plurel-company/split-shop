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

import { plurelEnvironmentFromKey } from "@/lib/plurel-env";
import {
  type PlurelCredentialMode,
  PLUREL_KEY_MODE_HEADER,
  modeLabel,
  parsePlurelCredentialMode,
} from "@/lib/plurel-credential-mode";

const STORAGE_KEY = "plurel-demo-key-mode";

type PlurelModeProviderProps = {
  merchantId: string;
  testPublishableKey: string;
  livePublishableKey: string;
  children: ReactNode;
};

type PlurelModeContextValue = {
  merchantId: string;
  mode: PlurelCredentialMode;
  setMode: (mode: PlurelCredentialMode) => void;
  publishableKey: string;
  environment: "sandbox" | "production";
  hasTestKey: boolean;
  hasLiveKey: boolean;
  modeHeaders: Record<string, string>;
  /** True after a network-level failure reaching plurelpay.com — routes the SDK
   *  through a vercel.app alias (some DNS filters block new domains). */
  apiFallback: boolean;
  enableApiFallback: () => void;
};

const PlurelModeContext = createContext<PlurelModeContextValue | null>(null);

function defaultMode(hasTest: boolean, hasLive: boolean): PlurelCredentialMode {
  if (hasTest) return "sandbox";
  if (hasLive) return "live";
  return "sandbox";
}

export function PlurelModeProvider({
  merchantId,
  testPublishableKey,
  livePublishableKey,
  children,
}: PlurelModeProviderProps) {
  const hasTestKey = Boolean(testPublishableKey);
  const hasLiveKey = Boolean(livePublishableKey);

  const [mode, setModeState] = useState<PlurelCredentialMode>(() =>
    defaultMode(hasTestKey, hasLiveKey),
  );
  const [apiFallback, setApiFallback] = useState(false);
  const enableApiFallback = useCallback(() => setApiFallback(true), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("ante-demo-key-mode");
      if (!stored) return;
      const parsed = parsePlurelCredentialMode(stored);
      if (parsed === "live" && hasLiveKey) setModeState("live");
      if (parsed === "sandbox" && hasTestKey) setModeState("sandbox");
    } catch {
      /* ignore */
    }
  }, [hasLiveKey, hasTestKey]);

  const setMode = useCallback(
    (next: PlurelCredentialMode) => {
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

  const value = useMemo<PlurelModeContextValue>(
    () => ({
      merchantId,
      mode,
      setMode,
      publishableKey,
      environment: plurelEnvironmentFromKey(publishableKey),
      hasTestKey,
      hasLiveKey,
      modeHeaders: { [PLUREL_KEY_MODE_HEADER]: mode },
      apiFallback,
      enableApiFallback,
    }),
    [merchantId, mode, setMode, publishableKey, hasTestKey, hasLiveKey, apiFallback, enableApiFallback],
  );

  return <PlurelModeContext.Provider value={value}>{children}</PlurelModeContext.Provider>;
}

export function usePlurelMode() {
  const context = useContext(PlurelModeContext);
  if (!context) {
    throw new Error("usePlurelMode must be used within PlurelModeProvider");
  }
  return context;
}

export { modeLabel };
