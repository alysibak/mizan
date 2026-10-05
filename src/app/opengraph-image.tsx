import { ImageResponse } from "next/og";

export const alt = "Mizan: a free, private zakat calculator and ledger";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card shown when a Mizan link is shared. */
export default function OpengraphImage() {
  const ink = "#0E2A22";
  const pine = "#12463A";
  const brass = "#A9874F";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "linear-gradient(160deg, #F3F5F1 0%, #E4ECE6 100%)",
          color: ink,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: brass, fontSize: 30 }}>
          <span>Mizan</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>Islamic wealth, in balance</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>
            What do you owe this year?
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: pine, maxWidth: 900 }}>
            A free, private zakat calculator and ledger. Nisab, hawl, and giving, kept in balance.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 40, fontSize: 28, color: pine }}>
            <span>2.5%</span>
            <span>85 g gold · 595 g silver</span>
            <span>Hijri hawl</span>
          </div>
          {/* The scale, drawn with plain boxes. */}
          <div style={{ display: "flex", position: "relative", width: 260, height: 120 }}>
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 30,
                width: 240,
                height: 3,
                background: ink,
                transform: "rotate(-6deg)",
              }}
            />
            <div style={{ position: "absolute", left: 128, top: 30, width: 3, height: 60, background: "#C9D3CC" }} />
            <div
              style={{
                position: "absolute",
                left: 116,
                top: 88,
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderBottom: `26px solid ${ink}`,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
