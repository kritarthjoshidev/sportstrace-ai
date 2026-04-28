import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f8fafc",
        bgSoft: "#f1f5f9",
        panel: "#ffffff",
        panelSoft: "#ffffff",
        panelMuted: "#eef2ff",
        ink: "#0f172a",
        muted: "#64748b",
        subdued: "#94a3b8",
        brand: "#6366f1",
        brand2: "#818cf8",
        cyan: "#06b6d4",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 23, 42, 0.08)",
        glow: "0 16px 36px rgba(99, 102, 241, 0.14)",
        glowSoft: "0 10px 24px rgba(6, 182, 212, 0.12)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.95)"
      },
      backgroundImage: {
        "app-grid":
          "radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 85% 0%, rgba(6, 182, 212, 0.1), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f8fafc 45%, #f1f5f9 100%)",
        "panel-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,247,251,0.96) 60%, rgba(241,245,249,0.92) 100%)",
        "mesh-glow":
          "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12), transparent 0 34%), radial-gradient(circle at 80% 0%, rgba(6,182,212,0.1), transparent 0 32%), radial-gradient(circle at 50% 100%, rgba(129,140,248,0.08), transparent 0 34%)"
      }
    }
  },
  plugins: [],
};

export default config;

