"use client";

import { useEffect, useState } from "react";

import { modeLabel, useAnteMode } from "@/components/ante-mode-provider";

type SetupStatus = {
  ok: boolean;
  issues: string[];
  mode?: string;
  publishableKeyLength?: number;
  testKey?: boolean;
  liveKey?: boolean;
};

export function SetupBanner() {
  const { mode, modeHeaders } = useAnteMode();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    void fetch("/api/setup/status", { headers: modeHeaders })
      .then((res) => res.json())
      .then((data: SetupStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, [mode, modeHeaders]);

  async function verifyCredentials() {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await fetch("/api/setup/verify", {
        method: "POST",
        headers: modeHeaders,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        detail?: string;
      };
      if (data.ok) {
        setVerifyMessage(data.message ?? "Credentials verified.");
      } else {
        const detail = data.detail && data.detail !== data.error ? ` (${data.detail})` : "";
        setVerifyMessage(`${data.error ?? "Verification failed."}${detail}`);
      }
    } catch {
      setVerifyMessage("Could not reach setup verification.");
    } finally {
      setVerifying(false);
    }
  }

  const verifyControl = (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void verifyCredentials()}
        disabled={verifying}
        className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {verifying ? "Verifying…" : `Verify ${modeLabel(mode)} credentials`}
      </button>
      {verifyMessage ? <span className="text-sm">{verifyMessage}</span> : null}
    </div>
  );

  if (!status) {
    return null;
  }

  if (status.ok) {
    return (
      <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
        <p>
          {modeLabel(mode)} env looks configured
          {status.publishableKeyLength ? ` (publishable key length: ${status.publishableKeyLength})` : ""}.
          {status.testKey && status.liveKey ? " Both test and live keys are set — use the header switch." : null}
        </p>
        {verifyControl}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">{modeLabel(mode)} checkout is not fully configured</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {status.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {verifyControl}
    </div>
  );
}
