import { ImageResponse } from "next/og";

/* Apple touch icon — a full-bleed terracotta orb tile (iOS masks the corners).
   Mirrors the .orb-mark gradient used throughout the site. */
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
          background:
            "radial-gradient(circle at 34% 30%, #FFE0CB 0%, #FFB48A 18%, #E66A37 52%, #B8421A 82%, #6E2510 100%)",
        }}
      />
    ),
    { ...size },
  );
}
