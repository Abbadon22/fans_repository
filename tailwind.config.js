/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#080a0d",
        panel: {
          DEFAULT: "#12161c",
          raised: "#1a2029",
          hover: "#222a35",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.12)",
        },
        brand: {
          DEFAULT: "#10b981",
          dim: "#059669",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        mint: "#34d399",
        sky: "#38bdf8",
      },
      fontFamily: {
        display: ['"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"Cascadia Mono"', "Consolas", "monospace"],
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        play: "0 8px 32px rgba(16, 185, 129, 0.35), 0 2px 0 rgba(255,255,255,0.1) inset",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};
