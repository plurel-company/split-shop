import { ImageResponse } from "next/og";
import { PLUREL_MARK_DATA_URI } from "@/lib/plurel-mark";

/* Apple touch icon — light surface with high-contrast stylized P mark. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F5F7",
          borderRadius: 40,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PLUREL_MARK_DATA_URI} width={120} height={120} alt="" />
      </div>
    ),
    { ...size },
  );
}
