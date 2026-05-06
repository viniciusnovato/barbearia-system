import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#17150F",
          color: "#FAFAF7",
          fontFamily: "Georgia, serif",
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
