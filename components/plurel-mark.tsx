import { PLUREL_MARK_BODY_PATH, PLUREL_MARK_STEM_PATH } from "@/lib/plurel-mark";

type PlurelMarkProps = {
  className?: string;
};

export function PlurelMark({ className }: PlurelMarkProps) {
  return (
    <svg
      className={className ?? "plurel-mark"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      role="img"
      aria-hidden="true"
    >
      <path fill="#0D0F12" d={PLUREL_MARK_BODY_PATH} />
      <path fill="#F26A2E" d={PLUREL_MARK_STEM_PATH} />
    </svg>
  );
}
