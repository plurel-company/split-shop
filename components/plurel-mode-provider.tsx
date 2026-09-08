"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoApiPath } from "@/lib/demo-config";
import { modeLabel, PLUREL_KEY_MODE_HEADER, type PlurelCredentialMode } from "@/lib/plurel-credential-mode";

type PublicConfig = { merchantId: string; publishableKey: string; ready: boolean };
type ModeContext = PublicConfig & {
  mode: PlurelCredentialMode; setMode: (mode: PlurelCredentialMode) => void;
  environment: "sandbox"; hasTestKey: boolean; hasLiveKey: boolean;
  modeHeaders: Record<string, string>; loading: boolean; refresh: () => void;
};
const Context = createContext<ModeContext | null>(null);
export function PlurelModeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig>({ merchantId: "", publishableKey: "", ready: false });
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(demoApiPath("/setup/public"), { signal: controller.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Sandbox unavailable"); return response.json() as Promise<PublicConfig>; })
      .then(value => { if (!controller.signal.aborted) setConfig(value); })
      .catch(() => { if (!controller.signal.aborted) setConfig({ merchantId: "", publishableKey: "", ready: false }); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const value = useMemo<ModeContext>(() => ({ ...config, loading, refresh, mode: "sandbox", setMode: () => {}, environment: "sandbox", hasTestKey: Boolean(config.publishableKey), hasLiveKey: false, modeHeaders: { [PLUREL_KEY_MODE_HEADER]: "sandbox" } }), [config, loading, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePlurelMode() {
  const context = useContext(Context);
  if (!context) throw new Error("usePlurelMode must be used within PlurelModeProvider");
  return context;
}
export { modeLabel };
