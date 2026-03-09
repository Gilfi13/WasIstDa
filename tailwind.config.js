// ESM-Syntax, wenn du export default benutzt
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'], // hier alle Dateien, die Tailwind scannen soll
  theme: {
    extend: {},
  },
  plugins: [], // Array von Tailwind-Plugins, leer, wenn du keine benutzt
}