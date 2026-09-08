"use client";

import { useEffect, useState } from "react";

import { modeLabel, usePlurelMode } from "@/components/plurel-mode-provider";

type SetupStatus = {
  ok: boolean;
  issues: string[];
  mode?: string;
  publishableKeyLength?: number;
  testKey?: boolean;
  liveKey?: boolean;
};

function VerifyMessage({ message, success }: { message: string; success: boolean }) {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const showChecklist = !success && lines.length > 1;

  return (
    <div
      className={`setup-verify-message ${success ? "setup-verify-message--success" : "setup-verify-message--error"}`}
      role="status"
      aria-live="polite"
    >
      {showChecklist ? (
        <>
          <p className="font-medium">{lines[0]}</p>
          <ul className="setup-verify-checklist">
            {lines.slice(1).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="whitespace-pre-line">{message}</p>
      )}
    </div>
  );
}

export function SetupBanner() {
  const { mode, modeHeaders } = usePlurelMode();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
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
    setVerifySuccess(false);
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
        details?: string[];
      };
      if (res.ok && data.ok) {
        setVerifySuccess(true);
        setVerifyMessage(data.message ?? "Credentials verified.");
      } else {
        const parts: string[] = [];
        if (data.error) parts.push(data.error);
        if (data.detail && data.detail !== data.error) parts.push(data.detail);
        if (data.details?.length) parts.push(...data.details);
        setVerifyMessage(parts.length > 0 ? parts.join("\n") : "Verification failed.");
      }
    } catch {
      setVerifyMessage("Could not reach setup verification.");
    } finally {
      setVerifying(false);
    }
  }

  const verifyControl = (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void verifyCredentials()}
        disabled={verifying}
        className="setup-verify-btn"
      >
        {verifying ? (
          <>
            <span className="checkout-spinner" aria-hidden />
            Verifying…
          </>
        ) : (
          `Verify ${modeLabel(mode)} credentials`
        )}
      </button>
      {verifyMessage ? <VerifyMessage message={verifyMessage} success={verifySuccess} /> : null}
    </div>
  );

  if (!status) {
    return null;
  }

  if (status.ok) {
    return (
      <div className="setup-banner setup-banner--ok">
        <p className="font-medium text-ink-2">{modeLabel(mode)} environment ready</p>
        <p className="mt-1 text-ink-3">
          {status.publishableKeyLength
            ? `Publishable key detected (${status.publishableKeyLength} chars).`
            : "Keys look configured."}
          {status.testKey && status.liveKey
            ? " Both test and live keys are set — use the header switch."
            : null}
        </p>
        {verifyControl}
      </div>
    );
  }

  return (
    <div className="setup-banner setup-banner--warn">
      <p className="font-medium">{modeLabel(mode)} checkout is not fully configured</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-terra-deep/90">
        {status.issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {verifyControl}
    </div>
  );
}
