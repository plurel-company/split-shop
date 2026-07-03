import { ImageResponse } from "next/og";

/* Link-preview card — mirrors splitante.com's OG language (paper, ink,
   terracotta orb lockup) so shared store links read unmistakably as Ante. */
export const alt = "Split Shop · Ante open demo";
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
          background: "#F4F2EC",
          color: "#111114",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 34% 30%, #FFE0CB 0%, #FFB48A 18%, #E66A37 52%, #B8421A 82%, #6E2510 100%)",
              boxShadow: "0 0 0 10px rgba(215,82,30,0.14)",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Ante</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A888F",
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
            Split Shop.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "#5C5A63",
              maxWidth: 860,
            }}
          >
            Build a cart, tap the Ante button, and split payment with friends — no real money
            moves.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
