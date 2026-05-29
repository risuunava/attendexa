/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A56DB',
          50: '#EBF5FF',
          100: '#D6EBFF',
          200: '#ADCFFF',
          300: '#75ABFF',
          400: '#3B82F6',
          500: '#1A56DB',
          600: '#1544B0',
          700: '#103485',
          800: '#0A245A',
          900: '#05142F',
        },
        accent: '#0EA5E9',
        // OurCreativity Brutalist accents
        brutalistYellow: '#FACC15',
        brutalistPink: '#F472B6',
        brutalistCyan: '#22D3EE',
        brutalistWhite: '#F8FAFC',
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        purple: {
          DEFAULT: '#7C3AED',
          light: '#EDE9FE',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(31, 38, 135, 0.1)',
        'glass-sm': '0 2px 12px rgba(31, 38, 135, 0.06)',
        // Brutalist shadows (Light mode adaptation: slightly softer alpha or pure black if wanted. The reference uses pure black #000, let's keep it bold)
        'brutalist-sm': '2px 2px 0px 0px #000',
        'brutalist': '4px 4px 0px 0px #000',
        'brutalist-lg': '8px 8px 0px 0px #000',
        'brutalist-white': '4px 4px 0px 0px #fff',
        'brutalist-rose': '4px 4px 0px 0px #e11d48',
        'brutalist-purple': '4px 4px 0px 0px #a855f7',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}