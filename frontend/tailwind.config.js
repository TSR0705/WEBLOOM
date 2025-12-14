/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Core surfaces */
        background: "#05070B",
        surface: "#0C0F14",
        panel: "#111418",

        /* Brand / Accent */
        neon: "#32FFC3",
        amber: "#FFC35E",
        alert: "#FF4E66",

        /* Text */
        muted: {
          1: "#9BA2B0",
          2: "#6B7280",
        },
      },

      boxShadow: {
        soft: "0 20px 40px rgba(2,6,23,0.6)",
        neon: "0 0 20px rgba(50,255,195,0.25)",
        neonStrong: "0 0 30px rgba(50,255,195,0.45)",
      },

      backdropBlur: {
        glass: "12px",
      },

      borderRadius: {
        card: "14px",
        badge: "8px",
        pill: "9999px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },

      backgroundImage: {
        "hero-gradient":
          "linear-gradient(90deg, #05070B, #0C1424, #11303D, #18C6A3)",
      },
    },
  },
  plugins: [],
};
