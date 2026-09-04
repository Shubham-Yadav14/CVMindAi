import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          bg: "#f8f9fa",
          bgSecondary: "#ffffff",
          text: "#1a1a1a",
          textSecondary: "#6b7280",
          border: "#e5e7eb",
          accent: "#3b82f6",
          accentHover: "#2563eb",
          success: "#10b981",
          error: "#ef4444",
          warning: "#f59e0b",
        },
        // Dark mode colors
        dark: {
          bg: "#0f172a",
          bgSecondary: "#1e293b",
          text: "#f1f5f9",
          textSecondary: "#cbd5e1",
          border: "#334155",
          accent: "#3b82f6",
          accentHover: "#60a5fa",
          success: "#10b981",
          error: "#ef4444",
          warning: "#f59e0b",
        },
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.1)",
        softDark: "0 2px 8px rgba(0, 0, 0, 0.3)",
        medium: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
