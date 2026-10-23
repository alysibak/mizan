import { formatMoney } from "@/lib/money";
import { BalanceScale } from "@/components/public/BalanceScale";

// Signature element: wealth on one pan, nisab on the other.
export default function Scale({
  net,
  nisab,
  currency,
  standardLabel,
  variant = "panel",
}: {
  net: number;
  nisab: number;
  currency: string;
  standardLabel: string;
  /** "panel" sits open on the page; "framed" is a bordered block. */
  variant?: "panel" | "framed" | "hero";
}) {
  const above = net >= nisab && nisab > 0;
  const large = variant === "hero";
  const money = (n: number) => formatMoney(n, currency, undefined, { whole: true });

  const inner = (
    <>
      {/* The same balance as on the public pages: savings against the minimum. */}
      <div className={"mx-auto " + (large ? "max-w-sm" : "max-w-[15rem]")}>
        <BalanceScale net={net} nisab={nisab} money={money} labels={{ you: "", nisab: "" }} bare />
      </div>

      <div className={"mt-2 grid grid-cols-2 gap-4 " + (large ? "mt-4" : "")}>
        <div className="min-w-0 text-left">
          <p className="label">What counts</p>
          <p
            className={
              "mt-1 break-words font-serif nums text-ink " + (large ? "text-3xl" : "text-xl sm:text-2xl")
            }
          >
            {formatMoney(net, currency, undefined, { whole: true })}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="label">Minimum (nisab, {standardLabel})</p>
          <p
            className={
              "mt-1 break-words font-serif nums text-brassDeep " + (large ? "text-3xl" : "text-xl sm:text-2xl")
            }
          >
            {formatMoney(nisab, currency, undefined, { whole: true })}
          </p>
        </div>
      </div>

      <div className="my-4 balance-rule animate-rule-draw" />

      <p
        className={
          "text-center text-sm font-medium " + (above ? "text-gain" : "text-sage")
        }
      >
        {above
          ? "Above the minimum: zakat is due on your zakat day."
          : "Below the minimum: no zakat is due."}
      </p>
    </>
  );

  if (variant === "framed") {
    return <div className="card p-6">{inner}</div>;
  }

  return <div className={large ? "" : "panel"}>{inner}</div>;
}
