import { formatMoney } from "@/lib/money";

// The signature element: a balance beam that tilts toward the heavier pan,
// your zakatable wealth on one side, the nisab threshold on the other.
export default function Scale({
  net,
  nisab,
  currency,
  standardLabel,
}: {
  net: number;
  nisab: number;
  currency: string;
  standardLabel: string;
}) {
  // Smooth, bounded tilt. Positive angle lowers the wealth (left) pan.
  const ratioLog = Math.log((net + 1) / (nisab + 1));
  const angle = Math.max(-9, Math.min(9, 9 * Math.tanh(ratioLog)));
  const above = net >= nisab && nisab > 0;

  return (
    <div className="card p-6">
      <div className="relative mx-auto h-28 max-w-sm">
        {/* Beam */}
        <div
          className="absolute left-1/2 top-6 h-px w-64 -translate-x-1/2 bg-ink/70 transition-transform duration-700"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        >
          <span className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
          <span className="absolute -right-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
        </div>
        {/* Fulcrum */}
        <div className="absolute left-1/2 top-6 h-12 w-px -translate-x-1/2 bg-mist" />
        <div className="absolute bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[18px] border-x-transparent border-b-ink/80" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div className="text-left">
          <p className="label">Your zakatable wealth</p>
          <p className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(net, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="label">Nisab ({standardLabel})</p>
          <p className="mt-1 font-serif text-2xl text-brass nums">
            {formatMoney(nisab, currency)}
          </p>
        </div>
      </div>

      <div className="my-4 balance-rule" />

      <p
        className={
          "text-center text-sm font-medium " +
          (above ? "text-gain" : "text-sage")
        }
      >
        {above
          ? "Your wealth is at or above nisab."
          : "Your wealth is below nisab. No zakat is due yet."}
      </p>
    </div>
  );
}
