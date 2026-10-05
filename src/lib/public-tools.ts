// The free tools anyone can use without an account. One list feeds the
// footer, the landing page, the sitemap, and the analytics allow-list.

export interface PublicTool {
  path: string;
  name: string;
  blurb: string;
}

export const PUBLIC_TOOLS: PublicTool[] = [
  {
    path: "/calculator",
    name: "Zakat calculator",
    blurb: "What you owe this year, against today’s nisab.",
  },
  {
    path: "/nisab",
    name: "Nisab today",
    blurb: "The silver and gold thresholds in 59 currencies, updated hourly.",
  },
  {
    path: "/inheritance",
    name: "Inheritance calculator",
    blurb: "Quranic shares of an estate, in exact fractions.",
  },
  {
    path: "/zakat-al-fitr",
    name: "Zakat al-Fitr",
    blurb: "What your household gives before the Eid prayer.",
  },
  {
    path: "/halal-stocks",
    name: "Halal stock screen",
    blurb: "Business and ratio checks, and dividend purification.",
  },
  {
    path: "/qurbani",
    name: "Qurbani shares",
    blurb: "Split the cost of a cow or camel among up to seven.",
  },
];

/** The English-only tool pages (the calculator and nisab pages are translated). */
export const ENGLISH_TOOL_PATHS = ["/inheritance", "/zakat-al-fitr", "/halal-stocks", "/qurbani"];
