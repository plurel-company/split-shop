"use client";

import { modeLabel, useAnteMode } from "@/components/ante-mode-provider";

export function AnteModeSwitch() {
  const { mode, setMode, hasTestKey, hasLiveKey } = useAnteMode();

  if (!hasTestKey && !hasLiveKey) return null;
  if (hasTestKey && !hasLiveKey) {
    return (
      <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900">
        Test mode
      </span>
    );
  }
  if (!hasTestKey && hasLiveKey) {
    return (
      <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-900">
        Live mode
      </span>
    );
  }

  return (
    <div
      className="inline-flex rounded-full border border-stone-200 bg-white p-1 text-sm"
      role="group"
      aria-label="Ante key mode"
    >
      {(["sandbox", "live"] as const).map((option) => {
        const active = mode === option;
        const disabled = option === "sandbox" ? !hasTestKey : !hasLiveKey;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => setMode(option)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? option === "live"
                  ? "bg-violet-600 text-white"
                  : "bg-sky-600 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            aria-pressed={active}
          >
            {modeLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
