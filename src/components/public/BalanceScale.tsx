import { scaleAngle } from "@/lib/scale";

/** Where coins sit on the savings pan, bottom row first. */
const COIN_PILE: [number, number][] = [
  [0, 37],
  [-12, 37],
  [12, 37],
  [-6, 32],
  [6, 32],
  [0, 27],
];

/**
 * Mizan means "the balance": your savings on one pan, the nisab on the
 * other. The beam tips towards the heavier side and moves as figures change
 * (still, for people who ask their device for less motion). Drawn left to
 * right in every language, with the words below it.
 */
export function BalanceScale({
  net,
  nisab,
  money,
  labels,
  className = "",
  bare = false,
}: {
  net: number;
  nisab: number;
  money: (n: number) => string;
  labels: { you: string; nisab: string };
  className?: string;
  /** Only the drawing, for a small scale beside its own words. */
  bare?: boolean;
}) {
  const angle = scaleAngle(net, nisab);
  const rad = (angle * Math.PI) / 180;
  const arm = 84;
  const pivot = { x: 120, y: 30 };
  const left = { x: pivot.x - arm * Math.cos(rad), y: pivot.y - arm * Math.sin(rad) };
  const right = { x: pivot.x + arm * Math.cos(rad), y: pivot.y + arm * Math.sin(rad) };
  const above = net >= nisab && net > 0;
  // More savings, a bigger pile: one coin for a little, six at twice nisab or more.
  const coins = net > 0 ? Math.max(1, Math.min(COIN_PILE.length, Math.ceil((net / Math.max(nisab, 1)) * 3))) : 0;
  const move = "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out";
  const pan = (fill: string) => (
    <>
      <path d="M0 0 L-24 40 M0 0 L24 40" className="stroke-sage/70" strokeWidth="1.2" fill="none" />
      <path d="M-28 40 Q0 58 28 40 Z" className={fill} />
    </>
  );
  return (
    <figure className={"mx-auto w-full max-w-xs " + className} aria-hidden dir="ltr">
      <svg viewBox="0 0 240 150" className="h-auto w-full overflow-visible" focusable="false">
        {/* Stand */}
        <path d="M120 30 V128" className="stroke-ink/70" strokeWidth="3" strokeLinecap="round" />
        <path d="M96 136 Q120 122 144 136 Z" className="fill-ink/70" />
        <circle cx="120" cy="22" r="5" className="fill-brass" />
        {/* Beam */}
        <g className={move} style={{ transform: `rotate(${angle}deg)`, transformOrigin: "120px 30px" }}>
          <path d="M36 30 H204" className="stroke-ink/80" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="120" cy="30" r="4" className="fill-ink" />
        {/* Your savings: coins */}
        <g className={move} style={{ transform: `translate(${left.x}px, ${left.y}px)` }}>
          {pan(above ? "fill-pine/80" : "fill-sage/50")}
          {COIN_PILE.slice(0, coins).map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="3" className="fill-brass stroke-brassDeep/40" strokeWidth="0.6" />
          ))}
        </g>
        {/* Nisab: a weight of silver */}
        <g className={move} style={{ transform: `translate(${right.x}px, ${right.y}px)` }}>
          {pan("fill-sage/50")}
          <path d="M-10 39 L-7 28 H7 L10 39 Z" className="fill-sage" />
        </g>
      </svg>
      <div className={"mt-1 grid grid-cols-2 gap-3 text-center text-xs" + (bare ? " hidden" : "")}>
        <div>
          <p className="text-sage">{labels.you}</p>
          <p className={"font-medium nums " + (above ? "text-pine" : "text-ink")}>{money(net)}</p>
        </div>
        <div>
          <p className="text-sage">{labels.nisab}</p>
          <p className="font-medium text-ink nums">{money(nisab)}</p>
        </div>
      </div>
    </figure>
  );
}
