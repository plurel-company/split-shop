"use client";

import { useEffect, useState } from "react";

type SetupStatus = {
  ok: boolean;
  issues: string[];
};

export function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    void fetch("/api/setup/status")
      .then((res) => res.json())
      .then((data: SetupStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  async function verifyCredentials() {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await fetch("/api/setup/verify", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (data.ok) {
        setVerifyMessage(data.message ?? "Credentials verified.");
      } else {
        setVerifyMessage(data.error ?? "Verification failed.");
      }
    } catch {
      setVerifyMessage("Could not reach setup verification.");
    } finally {
      setVerifying(false);
    }
  }

  if (!status || status.ok) {
    return verifyMessage ? (
      <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {verifyMessage}
      </p>
    ) : null;
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">Checkout is not fully configured</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {status.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void verifyCredentials()}
          disabled={verifying}
          className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {verifying ? "Verifying…" : "Verify Ante credentials"}
        </button>
        {verifyMessage ? <span>{verifyMessage}</span> : null}
      </div>
    </div>
  );
}
