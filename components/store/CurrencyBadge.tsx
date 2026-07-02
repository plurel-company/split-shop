import { type CurrencyCode } from "@/lib/currency";

const CURRENCY_BADGE_STYLES: Record<CurrencyCode, string> = {
  USD: "bg-paper-2 text-ink-2 ring-hair-2",
  EUR: "bg-indigo-50 text-indigo-800 ring-indigo-200/80",
  GBP: "bg-terra-soft text-terra-deep ring-terra-dim",
  JPY: "bg-rose-50 text-rose-800 ring-rose-200/80",
};

type CurrencyBadgeProps = {
  currency: CurrencyCode;
  size?: "sm" | "md";
};

export function CurrencyBadge({ currency, size = "sm" }: CurrencyBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ring-1 ring-inset ${sizeClass} ${CURRENCY_BADGE_STYLES[currency]}`}
    >
      {currency}
    </span>
  );
}
