/**
 * Render the PNG app icons from src/app/icon.svg. The output is committed, so
 * builds never need this; rerun it after changing the icon:
 *   node scripts/generate-icons.mjs
 *
 * - icon-192/512: the icon as drawn (rounded square).
 * - maskable-512: full-bleed background with the mark inside the 80% safe
 *   zone, so Android launchers can crop it to any shape.
 * - apple-touch-icon: full-bleed square; iOS rounds the corners itself and
 *   would otherwise paint transparent corners black.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/app/icon.svg"), "utf8");
const out = path.join(root, "public/icons");
fs.mkdirSync(out, { recursive: true });

const inner = source
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/<rect[^>]*\/>/, "");
const background = /<rect[^>]*fill="([^"]+)"/.exec(source)?.[1] ?? "#0E2A22";

/** The mark on a full-bleed square, scaled about the centre. */
function fullBleed(scale) {
  const offset = (512 * (1 - scale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${background}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${inner}</g>
</svg>`;
}

const jobs = [
  ["icon-192.png", source, 192],
  ["icon-512.png", source, 512],
  ["maskable-512.png", fullBleed(0.72), 512],
  ["apple-touch-icon.png", fullBleed(0.86), 180],
];

for (const [name, svg, size] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(out, name));
  console.log(`wrote public/icons/${name}`);
}
