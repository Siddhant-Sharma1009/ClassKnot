/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: "#f8f5ff",
          100: "#f3ebff",
          200: "#e9d5ff",
          300: "#d4a5ff",
          400: "#ba55d3",
          500: "#9f3ae0",
          600: "#7e22ce",
          700: "#6b21a8",
          800: "#581c87",
          900: "#3f0f5c",
        },
      },
    },
  },
  plugins: [],
};
