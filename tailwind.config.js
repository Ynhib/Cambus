/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme INOX - Laboratoire Professionnel
        inox: {
          900: '#18181b', // zinc-900 pour le fond profond
          800: '#27272a', // zinc-800 pour les cartes/surfaces
          700: '#3f3f46', // zinc-700 pour les bordures et dividers
          text: '#f4f4f5', // zinc-50 pour le texte principal
          muted: '#a1a1aa', // zinc-400 pour le texte secondaire
        },
        // Accents
        fefo: {
          DEFAULT: '#E0115F', // Rouge Ruby "Alerte" (Péremption, Perte)
          light: '#f43f5e',
          dark: '#be123c',
        },
        profit: {
          DEFAULT: '#10b981', // Vert Émeraude "Sain" (Bon stock, Marge)
          light: '#34d399',
          dark: '#059669',
        },
        action: {
          DEFAULT: '#06b6d4', // Bleu / Cyan Électrique (Boutons principaux)
          light: '#22d3ee',
          dark: '#0891b2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'], // Pour l'affichage clair de chiffres/codes
      },
      boxShadow: {
        'inox': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.24)',
        'inox-glow': '0 0 10px rgba(6, 182, 212, 0.3)', // Glow cyan pour les actions
      }
    },
  },
  plugins: [],
}
