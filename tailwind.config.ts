import type { Config } from "tailwindcss";

// Mizan design tokens. Identity: a calm "ledger" for sacred wealth.
// Palette intentionally avoids the cream + serif + terracotta default.
// Deep pine ink on cool porcelain, with restrained brass for value highlights.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        porcelain: "#F5F7F4", // cool off-white page
        paper: "#FBFCFA", // raised surfaces (cards)
        ink: "#0E2A22", // deep pine, primary text
        pine: "#12463A", // mid green, primary actions
        sage: "#5B7B6F", // muted secondary text
        mist: "#E3E9E4", // hairlines, borders
        brass: "#A9874F", // nisab / value accent (the metal of nisab)
        brassDeep: "#8A6C3A",
        gain: "#1E7A53", // positive / above nisab
        warn: "#B5852A", // caution
        danger: "#9F3B36", // destructive / below nisab
      },
      fontFamily: {
        serif: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Palatino",
          "Georgia",
          "Cambria",
          "serif",
        ],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,42,34,0.04), 0 8px 24px -16px rgba(14,42,34,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
