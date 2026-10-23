import { type CurrencyCode } from "@/lib/currency";

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
      className={`inline-flex items-center rounded border border-hair-2 bg-white font-semibold tracking-wide text-ink-2 ${sizeClass}`}
    >
      {currency}
    </span>
  );
}
