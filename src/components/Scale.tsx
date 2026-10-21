import { formatMoney } from "@/lib/money";

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
  const ratioLog = Math.log((net + 1) / (nisab + 1));
  const angle = Math.max(-9, Math.min(9, 9 * Math.tanh(ratioLog)));
  const above = net >= nisab && nisab > 0;
  const large = variant === "hero";

  const inner = (
    <>
      <div className={"relative mx-auto " + (large ? "h-36 max-w-md" : "h-28 max-w-sm")}>
        <div
          className={
            "absolute left-1/2 top-6 h-px -translate-x-1/2 bg-ink/70 transition-transform duration-700 " +
            (large ? "w-72" : "w-64")
          }
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        >
          <span className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
          <span className="absolute -right-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
        </div>
        <div className="absolute left-1/2 top-6 h-12 w-px -translate-x-1/2 bg-mist" />
        <div className="absolute bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[18px] border-x-transparent border-b-ink/80" />
      </div>

      <div className={"mt-2 grid grid-cols-2 gap-4 " + (large ? "mt-4" : "")}>
        <div className="min-w-0 text-left">
          <p className="label">What counts</p>
          <p
            className={
              "mt-1 break-words font-serif nums text-ink " + (large ? "text-3xl" : "text-xl sm:text-2xl")
            }
          >
            {formatMoney(net, currency)}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="label">Minimum (nisab, {standardLabel})</p>
          <p
            className={
              "mt-1 break-words font-serif nums text-brassDeep " + (large ? "text-3xl" : "text-xl sm:text-2xl")
            }
          >
            {formatMoney(nisab, currency)}
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
