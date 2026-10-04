import type { Config } from "tailwindcss";

// Ruled ledger: cool porcelain, deep pine, brass for metal value. Colours are
// CSS variables (see globals.css) so one set of classes serves light and dark
// themes; every text colour meets WCAG AA (4.5:1) on every surface.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        porcelain: token("porcelain"),
        paper: token("paper"),
        surface: token("surface"),
        ink: token("ink"),
        pine: token("pine"),
        sage: token("sage"),
        mist: token("mist"),
        brass: token("brass"),
        brassDeep: token("brass-deep"),
        gain: token("gain"),
        warn: token("warn"),
        danger: token("danger"),
      },
      fontFamily: {
        serif: ["var(--font-literata)", "Georgia", "serif"],
        sans: ["var(--font-source)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "4px",
      },
      boxShadow: {
        card: "none",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "rule-draw": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "rule-draw": "rule-draw 0.9s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
