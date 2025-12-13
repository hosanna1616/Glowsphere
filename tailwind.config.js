/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          900: "#1c1917",
          800: "#292524",
        },
        amber: {
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        yellow: {
          600: "#ca8a04",
        },
        gray: {
          300: "#d1d5db",
        },
      },
    },
  },
  plugins: [],
};
