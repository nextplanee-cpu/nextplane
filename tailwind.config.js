/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Next Plane — Paleta oficial ───────────────────────────
        brand:        '#F97316',   // laranja marca — vivo, vibrante
        'brand-dark': '#EA6C0A',   // laranja escuro hover
        'brand-light':'#FB923C',   // laranja claro
        // ── Backgrounds quentes (não navy frio / não SaaS) ───────
        base:         '#0E0A06',   // fundo principal — carvão com subtom âmbar
        surface:      '#130D07',   // seções alternadas — ainda mais quente
        card:         '#1C1208',   // cards — quente
        'card-hover': '#231708',   // card hover
      },
      fontFamily: {
        sans:      ['Inter', 'sans-serif'],
        inter:     ['Inter', 'sans-serif'],
        poppins:   ['Poppins', 'sans-serif'],
        serif:     ['"Cormorant Garamond"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
