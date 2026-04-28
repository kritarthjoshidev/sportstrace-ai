import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#08111d",
        panel: "#101d30",
        panelAlt: "#16253d",
        ink: "#eef3fb",
        muted: "#90a3c0",
        accent: "#39d0c8",
        accentSoft: "#1e625f",
        warning: "#ff9f5a",
        danger: "#ff5d73",
        success: "#77e58b"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(11, 229, 197, 0.14)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at top, rgba(57,208,200,0.16), transparent 35%), linear-gradient(180deg, rgba(8,17,29,1) 0%, rgba(8,17,29,0.96) 100%)"
      }
    }
  },
  plugins: [],
};

export default config;

