import { formatMoney } from "@/components/ui/format-money";
import { type CurrencyCode } from "@/lib/currency";
import { type ProductFee } from "@/lib/store";

type FeePreviewProps = {
  fees: ProductFee[];
  currency: CurrencyCode;
  compact?: boolean;
};

export function FeePreview({ fees, currency, compact = false }: FeePreviewProps) {
  if (!fees.length) return null;

  return (
    <div
      className={
        compact
          ? "mt-3 rounded-lg bg-paper-2/60 px-3 py-2.5"
          : "mt-4 rounded-xl border border-hair bg-gradient-to-br from-paper-2/60 to-terra-soft/40 px-3.5 py-3"
      }
    >
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-3">
        Fees at checkout
      </p>
      <ul className="mt-1.5 space-y-1">
        {fees.map((fee) => (
          <li key={fee.id} className="flex justify-between gap-3 text-xs text-ink-2">
            <span className="truncate">{fee.label}</span>
            <span className="shrink-0 font-mono font-medium tabular-nums text-ink-2">
              {formatMoney(fee.amount, currency)}
              <span className="font-sans font-normal text-ink-4">
                {fee.billing === "per_night" ? " / night" : " / stay"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
