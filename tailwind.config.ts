import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        theater: {
          950: "#07080c",
          900: "#0e1017",
          850: "#131620",
          800: "#1a1e2b",
          700: "#272d3f",
          600: "#3d455f",
          500: "#5a6485",
        },
        brand: {
          purple: "#8b5cf6",
          violet: "#7c3aed",
          indigo: "#6366f1",
          cyan: "#06b6d4",
          pink: "#ec4899",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-up": "floatUp 2.5s ease-out forwards",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(0.8)" },
          "50%": { opacity: "0.9", transform: "translateY(-40px) scale(1.2)" },
          "100%": { opacity: "0", transform: "translateY(-100px) scale(0.9)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
