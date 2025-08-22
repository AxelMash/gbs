/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",   // se hai pages/
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx,mdx}", // se hai app/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
