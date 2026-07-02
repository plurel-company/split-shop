type QuantityStepperProps = {
  quantity: number;
  unitLabel: string;
  onAdd: () => void;
  onRemove: () => void;
  productName: string;
  size?: "sm" | "md";
  disabled?: boolean;
};

export function QuantityStepper({
  quantity,
  unitLabel,
  onAdd,
  onRemove,
  productName,
  size = "md",
  disabled = false,
}: QuantityStepperProps) {
  const plural = quantity === 1 ? unitLabel : `${unitLabel}s`;
  const buttonSize = size === "sm" ? "h-8 w-8 text-sm" : "h-9 w-9";
  const countSize = size === "sm" ? "min-w-7 text-xs" : "min-w-8 text-sm";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRemove}
        disabled={quantity === 0}
        className={`${buttonSize} flex shrink-0 items-center justify-center rounded-full border border-hair-2 bg-white text-ink transition hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={`Remove one ${unitLabel} at ${productName}`}
      >
        −
      </button>
      <span className={`${countSize} text-center font-medium tabular-nums text-ink`}>
        {quantity}
        {quantity > 0 ? (
          <span className="block font-mono text-[10px] font-normal uppercase tracking-wide text-ink-3">
            {plural}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={`${buttonSize} flex shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-[#26272D] disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={`Add one ${unitLabel} at ${productName}`}
      >
        +
      </button>
    </div>
  );
}
