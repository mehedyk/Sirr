/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fira-code': ['Fira Code', 'monospace'],
        'source-code-pro': ['Source Code Pro', 'monospace'],
        'roboto-mono': ['Roboto Mono', 'monospace'],
        'jetbrains-mono': ['JetBrains Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
        'orbitron': ['Orbitron', 'sans-serif'],
        'exo': ['Exo 2', 'sans-serif'],
        'barlow': ['Barlow', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
