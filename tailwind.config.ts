import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#1F5C45", deep: "#143B2C" },
        leaf: "#4E9E72",
        sage: "#74B58C",
        clay: "#D98E5A",
        cream: { DEFAULT: "#F6F1E7", muted: "#EFE8D9" },
        ink: "#23332B",
      },
      fontFamily: {
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      // Elevation scale — all shadows are tinted with the forest-deep hue so
      // surfaces feel grounded in the brand instead of generic grey.
      boxShadow: {
        soft: "0 1px 2px rgba(20, 59, 44, 0.04), 0 8px 24px -12px rgba(20, 59, 44, 0.10)",
        lift: "0 2px 6px rgba(20, 59, 44, 0.05), 0 20px 48px -16px rgba(20, 59, 44, 0.18)",
        glow: "0 10px 28px -10px rgba(31, 92, 69, 0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        // Dots that visibly move up and down (a "thinking" wave), staggered per dot.
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out both",
        blink: "blink 1.2s infinite",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
