/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'asset-dark': '#0d0d0d',
        'asset-light': '#e8e8e8',
        'asset-green': '#3a5a40',
      },
    },
  },
  plugins: [],
}

