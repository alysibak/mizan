/**
 * How far the balance tips, in degrees, for savings against nisab: negative
 * (savings side down) when savings are heavier, positive when the nisab is,
 * level when they are equal. Never more than `max` either way, so a fortune
 * and a modest sum above nisab both read as "above" without leaving the frame.
 */
export function scaleAngle(net: number, nisab: number, max = 14): number {
  const heavier = Math.max(net, nisab, 1);
  const ratio = (Math.max(net, 0) - Math.max(nisab, 0)) / heavier;
  const tilt = -Math.max(-1, Math.min(1, ratio)) * max;
  return tilt === 0 ? 0 : tilt;
}
