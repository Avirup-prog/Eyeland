/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        island: '#000000',
        mint: '#c5f8d6',
        neutral: {
          750: '#2b2b30',
          850: '#1b1b1f',
        }
      }
    },
  },
  plugins: [],
}
