/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#E2E4E8",
        input: "#E2E4E8",
        ring: "#000000",
        background: "#FFFFFF",
        foreground: "#0A0B0D",
        surface: "#F5F6F7",
        primary: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F6F7",
          foreground: "#0A0B0D",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F6F7",
          foreground: "#5D6679",
        },
        accent: {
          DEFAULT: "#F5F6F7",
          foreground: "#0A0B0D",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0A0B0D",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0A0B0D",
        },
        // Reference Token Specifics
        "hyper-blue": "#000000",
        "stark-white": "#FFFFFF",
        "text-main": "#0A0B0D",
        "text-muted": "#5D6679",
        "border-subtle": "#E2E4E8",
        positive: "#16A34A",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
