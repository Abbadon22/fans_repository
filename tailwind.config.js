/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#1a1d24",
          elevated: "#23272f",
          border: "#2e3440",
        },
        accent: {
          DEFAULT: "#e85d04",
          hover: "#f48c06",
          muted: "#9a3412",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
