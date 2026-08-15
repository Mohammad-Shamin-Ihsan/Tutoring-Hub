/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./admin/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Deep navy — professional/trustworthy primary palette.
        brand: {
          50: "#eef2f7",
          100: "#d7e0ea",
          200: "#b0c1d6",
          300: "#88a3c1",
          400: "#5f84ac",
          500: "#3d6690",
          600: "#2c4f73",
          700: "#223d59",
          800: "#1a2e44",
          900: "#111c2a",
        },
        // Warm gold accent for CTAs/highlights.
        accent: {
          50: "#fdf8ec",
          100: "#faedc7",
          200: "#f5da8f",
          300: "#efc457",
          400: "#e6ab2e",
          500: "#c9911f",
          600: "#a3741a",
          700: "#7d5915",
          800: "#5a4010",
          900: "#3c2a0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  // 8px spacing rhythm: stick to Tailwind's built-in even-numbered scale
  // (p-2 = 8px, p-4 = 16px, p-6 = 24px, p-8 = 32px, ...) rather than odd values.
  plugins: [require("@tailwindcss/forms")],
};
