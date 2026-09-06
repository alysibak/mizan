import type { Config } from "tailwindcss";

// Ruled ledger: cool porcelain, deep pine, brass for metal value.
// Avoids cream/terracotta and purple SaaS defaults.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        porcelain: "#F3F5F1",
        paper: "#FAFBF8",
        ink: "#0E2A22",
        pine: "#12463A",
        sage: "#5B7B6F",
        mist: "#D8E0DA",
        brass: "#A9874F",
        brassDeep: "#8A6C3A",
        gain: "#1E7A53",
        warn: "#B5852A",
        danger: "#9F3B36",
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
