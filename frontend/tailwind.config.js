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
        'glass-white': 'rgba(255, 255, 255, 0.06)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'green-glow': '0 0 20px rgba(58, 90, 64, 0.45)',
        'accent-glow': '0 0 15px rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
}

