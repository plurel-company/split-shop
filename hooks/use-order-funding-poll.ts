"use client";

import { useEffect, useRef } from "react";

import type { FundedOrder } from "@/lib/order-store";

const POLL_MS = 2000;
const TIMEOUT_MS = 5 * 60 * 1000;

type UseOrderFundingPollOptions = {
  orderRef: string | null;
  enabled: boolean;
  onFunded: (order: FundedOrder) => void;
  onError?: (message: string) => void;
};

export async function fetchFundedOrder(orderRef: string): Promise<FundedOrder | null> {
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { order?: FundedOrder };
    return data.order?.status === "funded" ? data.order : null;
  } catch {
    return null;
  }
}

export function useOrderFundingPoll({
  orderRef,
  enabled,
  onFunded,
  onError,
}: UseOrderFundingPollOptions) {
  const onFundedRef = useRef(onFunded);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onFundedRef.current = onFunded;
  }, [onFunded]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !orderRef) return;

    const ref = orderRef;
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      while (!cancelled && Date.now() - startedAt < TIMEOUT_MS) {
        const funded = await fetchFundedOrder(ref);
        if (cancelled) return;
        if (funded) {
          onFundedRef.current(funded);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [enabled, orderRef]);
}
