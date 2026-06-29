"use client";

import { modeLabel, useAnteMode } from "@/components/ante-mode-provider";

function ModeBadge({ mode }: { mode: "sandbox" | "live" }) {
  const isLive = mode === "live";
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        isLive ? "bg-violet-100 text-violet-900" : "bg-sky-100 text-sky-900"
      }`}
    >
      {modeLabel(mode)} only
    </span>
  );
}

export function AnteModeSwitch() {
  const { mode, setMode, hasTestKey, hasLiveKey } = useAnteMode();
  const isLive = mode === "live";
  const canToggle = hasTestKey && hasLiveKey;

  if (!hasTestKey && !hasLiveKey) return null;
  if (!canToggle) {
    return <ModeBadge mode={hasLiveKey ? "live" : "sandbox"} />;
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`text-sm font-medium transition-colors ${!isLive ? "text-stone-900" : "text-stone-400"}`}
      >
        Test
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        aria-label={isLive ? "Live mode on" : "Test mode on"}
        onClick={() => setMode(isLive ? "sandbox" : "live")}
        className={`relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
          isLive ? "bg-green-500" : "bg-stone-300"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none block h-7 w-7 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.28)] transition-transform duration-200 ease-in-out ${
            isLive ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${isLive ? "text-stone-900" : "text-stone-400"}`}
      >
        Live
      </span>
    </div>
  );
}
