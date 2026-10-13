/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pharmacy: {
          primary: "#0F766E",
          hover: "#115E59",
          light: "#F0FDFA",
          text: "#1F2937",
          muted: "#64748B",
          border: "#E2E8F0",
          bg: "#FFFFFF",
          secondaryBg: "#F8FAFC",
          success: "#15803D",
          warning: "#B45309",
          danger: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
}
