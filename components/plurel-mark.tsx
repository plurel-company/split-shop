import { demoAssetPath } from "@/lib/demo-config";

type PlurelMarkProps = {
  className?: string;
};

export function PlurelMark({ className }: PlurelMarkProps) {
  return (
    <img
      className={className ?? "plurel-mark"}
      src={demoAssetPath("/brand/plurel/plurel-starburst-mark.svg")}
      alt=""
      width="64"
      height="64"
      aria-hidden="true"
    />
  );
}
