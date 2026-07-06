import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        // ── Surfaces ─────────────────────────────────
        surface: {
          base: "#09090B",
          card: "#111113",
          hover: "#1A1A1E",
          active: "#222226",
        },
        // ── Borders ──────────────────────────────────
        border: {
          DEFAULT: "#27272A",
          subtle: "#1E1E22",
          strong: "#3F3F46",
        },
        // ── Text ─────────────────────────────────────
        text: {
          primary: "#FAFAFA",
          secondary: "#A1A1AA",
          tertiary: "#71717A",
          muted: "#52525B",
        },
        // ── Brand accent (gold) ──────────────────────
        gold: {
          50: "#FFF9EB",
          100: "#FFF0C6",
          200: "#FFE08A",
          300: "#FFCB47",
          400: "#F5A623",  // primary gold
          500: "#E5940D",
          600: "#C97208",
          700: "#A1520B",
          800: "#844010",
          900: "#6D3413",
        },
        // ── Semantic ─────────────────────────────────
        correct: {
          DEFAULT: "#10B981",
          muted: "rgba(16, 185, 129, 0.15)",
        },
        wrong: {
          DEFAULT: "#EF4444",
          muted: "rgba(239, 68, 68, 0.10)",
        },
        live: {
          DEFAULT: "#10B981",
          pulse: "#34D399",
        },
        confidence: {
          safe: "#71717A",
          double: "#F59E0B",
          triple: "#F43F5E",
        },
        // ── shadcn compatibility ─────────────────────
        input: "#27272A",
        ring: "#F5A623",
        background: "#09090B",
        foreground: "#FAFAFA",
        primary: {
          DEFAULT: "#F5A623",
          foreground: "#09090B",
        },
        secondary: {
          DEFAULT: "#27272A",
          foreground: "#FAFAFA",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#1A1A1E",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#1A1A1E",
          foreground: "#FAFAFA",
        },
        popover: {
          DEFAULT: "#111113",
          foreground: "#FAFAFA",
        },
        card: {
          DEFAULT: "#111113",
          foreground: "#FAFAFA",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
        xl: "16px",
        "2xl": "20px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "score-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "resolve-correct": {
          "0%": { backgroundColor: "transparent" },
          "30%": { backgroundColor: "rgba(16, 185, 129, 0.25)" },
          "100%": { backgroundColor: "rgba(16, 185, 129, 0.08)" },
        },
        "resolve-wrong": {
          "0%": { backgroundColor: "transparent" },
          "30%": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
          "100%": { backgroundColor: "rgba(239, 68, 68, 0.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "score-pop": "score-pop 0.3s ease-out",
        "resolve-correct": "resolve-correct 0.6s ease-out forwards",
        "resolve-wrong": "resolve-wrong 0.6s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;