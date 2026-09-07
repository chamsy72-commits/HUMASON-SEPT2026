/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HUMASON Official Palette
        'dark-bg': '#12131C',
        'dark-surface': '#1E202E',
        'dark-border': '#2A2D3E',
        'humason-gold': '#D4AF37',
        'humason-gold-hover': '#B8952B',
        'humason-cyan': '#00E5FF',
        'humason-cyan-glow': 'rgba(0, 229, 255, 0.25)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        
        // Structured Namespace Aliases
        humason: {
          gold: '#D4AF37',
          'gold-hover': '#B8952B',
          cyan: '#00E5FF',
          'cyan-glow': 'rgba(0, 229, 255, 0.25)',
        },
        dark: {
          bg: '#12131C',
          surface: '#1E202E',
          border: '#2A2D3E',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 229, 255, 0.4), 0 0 30px rgba(0, 229, 255, 0.15)',
        'glow-cyan-sm': '0 0 8px rgba(0, 229, 255, 0.3)',
        'glow-cyan-lg': '0 0 25px rgba(0, 229, 255, 0.5), 0 0 50px rgba(0, 229, 255, 0.25)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.15)',
        'glow-gold-sm': '0 0 8px rgba(212, 175, 55, 0.3)',
        'glow-gold-lg': '0 0 25px rgba(212, 175, 55, 0.5), 0 0 50px rgba(212, 175, 55, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
        'glass-deep': '20px',
      },
      animation: {
        'pulse-glow-cyan': 'pulseGlowCyan 2.5s infinite ease-in-out',
        'pulse-glow-gold': 'pulseGlowGold 2.5s infinite ease-in-out',
      },
      keyframes: {
        pulseGlowCyan: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 229, 255, 0.2), 0 0 16px rgba(0, 229, 255, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.5), 0 0 35px rgba(0, 229, 255, 0.25)' },
        },
        pulseGlowGold: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212, 175, 55, 0.2), 0 0 16px rgba(212, 175, 55, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5), 0 0 35px rgba(212, 175, 55, 0.25)' },
        },
      }
    },
  },
  plugins: [],
}
