import { ImageResponse } from "next/og";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { getMetalPrices } from "@/lib/price-fetch";

export const NISAB_CARD_SIZE = { width: 1200, height: 630 };

const INK = "#0E2A22";
const PINE = "#12463A";
const BRASS = "#A9874F";

/** "PKR 325,557": the code, not a symbol, so every currency renders in the card's font. */
function amount(n: number, code: string): string {
  return `${code} ${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * The link preview for a nisab page: today's thresholds in one currency.
 * Messaging apps show it when the page is shared, so it is the number
 * people see first. Falls back to a plain card when prices are unavailable.
 */
export async function nisabCard(code: string): Promise<ImageResponse> {
  const prices = await getMetalPrices(code);
  const day = new Date(prices?.asOf ?? Date.now()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const row = (label: string, grams: number, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", fontSize: 28, color: BRASS, letterSpacing: 2 }}>
        {`${label} · ${grams} g`}
      </div>
      <div style={{ display: "flex", fontSize: 76, color: INK, letterSpacing: -1 }}>{value}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 88px",
          background: "linear-gradient(160deg, #F3F5F1 0%, #E4ECE6 100%)",
          color: INK,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30, color: BRASS }}>
          <span>Mizan</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{`Nisab today · ${code}`}</span>
        </div>
        {prices ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {row("SILVER", NISAB_SILVER_GRAMS, amount(NISAB_SILVER_GRAMS * prices.silverPricePerGram, code))}
            {row("GOLD", NISAB_GOLD_GRAMS, amount(NISAB_GOLD_GRAMS * prices.goldPricePerGram, code))}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.1 }}>
            {`Today’s nisab in ${code}`}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: PINE }}>
          <span>{prices ? `Live prices, ${day}` : "Live gold and silver prices"}</span>
          <span>Free zakat calculator</span>
        </div>
      </div>
    ),
    NISAB_CARD_SIZE,
  );
}
