import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SOCIAL_PREVIEW_SIZE = { width: 1200, height: 630 };

export async function createSocialPreviewImage() {
  const canonicalLogo = await readFile(
    join(process.cwd(), "public/brand/shadowscore-infinity.svg"),
    "base64",
  );

  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "linear-gradient(135deg, #080b18 0%, #10142b 58%, #111936 100%)",
        color: "#f7f8ff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "68px 76px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "radial-gradient(circle, rgba(81, 208, 255, 0.2) 0%, rgba(81, 208, 255, 0) 70%)",
          display: "flex",
          height: 520,
          position: "absolute",
          right: -120,
          top: -190,
          width: 520,
        }}
      />

      <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
        {/* next/image is not supported by ImageResponse. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height={46}
          src={`data:image/svg+xml;base64,${canonicalLogo}`}
          width={92}
        />
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>
          ShadowScore
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 930 }}>
        <div style={{ color: "#8fdfff", display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 3, marginBottom: 22, textTransform: "uppercase" }}>
          Business Trust Intelligence
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.08 }}>
          Due diligence for better business decisions.
        </div>
        <div style={{ color: "#bdc5dd", display: "flex", fontSize: 28, lineHeight: 1.4, marginTop: 26 }}>
          Verify identity, review risk signals, and trace findings to source evidence.
        </div>
      </div>

      <div style={{ alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.16)", color: "#929bb7", display: "flex", fontSize: 21, justifyContent: "space-between", paddingTop: 24 }}>
        <div style={{ display: "flex" }}>Business Due Diligence &amp; Company Verification</div>
        <div style={{ color: "#f7f8ff", display: "flex", fontWeight: 700 }}>shadowscore.io</div>
      </div>
    </div>,
    SOCIAL_PREVIEW_SIZE,
  );
}
