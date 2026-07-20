import { ImageResponse } from "next/og";
import { PLUREL_MARK_DATA_URI } from "@/lib/plurel-mark";

export const alt = "Split Shop · Plurel Pay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#F4F5F7",
          color: "#0D0F12",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PLUREL_MARK_DATA_URI} width={52} height={52} alt="" />
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "#F26A2E" }}>
            Plurel Pay
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#76747c",
            }}
          >
            Open demo · Sandbox only
          </div>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 600,
              maxWidth: 920,
            }}
          >
            Split Shop · Plurel Pay
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "#3a3a40",
              maxWidth: 860,
            }}
          >
            Build a cart, split with Plurel Pay, and pay with friends — no real money moves.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
