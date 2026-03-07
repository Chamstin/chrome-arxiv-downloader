import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,ts,tsx}"],
  prefix: "axd-",
  theme: {
    extend: {
      colors: {
        ink: "#112031",
        fog: "#F4F7FB",
        brand: {
          50: "#F2F8FF",
          100: "#DCEBFF",
          200: "#B6D2FF",
          300: "#83B0FF",
          400: "#4B89F1",
          500: "#2462CC",
          600: "#1D4DA2",
          700: "#173B7D",
          800: "#122C5F",
          900: "#0E2249"
        },
        accent: {
          500: "#F97316",
          600: "#EA580C"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(17, 32, 49, 0.18)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
      backgroundImage: {
        "paper-mesh":
          "radial-gradient(circle at top left, rgba(75, 137, 241, 0.18), transparent 35%), radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.12), transparent 30%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
