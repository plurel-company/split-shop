import { ImageResponse } from "next/og";

/* Apple touch icon — solid Plurel accent (iOS masks the corners). */
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
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            display: "flex",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 43,
              top: 8,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#F26A2E",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 36,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#0D0F12",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 36,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#0D0F12",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 72,
              width: 72,
              height: 28,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 36,
              borderBottomLeftRadius: 36,
              background: "#E6E1DC",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
