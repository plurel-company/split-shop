type SectionHeaderProps = {
  id?: string;
  title: string;
  subtitle: string;
  count?: number;
  countLabel?: string;
};

export function SectionHeader({
  id,
  title,
  subtitle,
  count,
  countLabel = "items",
}: SectionHeaderProps) {
  return (
    <div className="section-header mb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id={id} className="section-header__title">
              {title}
            </h2>
            {count !== undefined ? (
              <span className="rounded-full border border-hair-2 bg-white px-2.5 py-0.5 font-mono text-[11px] text-ink-2">
                {count} {count === 1 ? countLabel.replace(/s$/, "") : countLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
