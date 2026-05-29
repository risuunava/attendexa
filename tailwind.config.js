/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A56DB',
          light: '#EBF5FF',
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
        'glass-sm': '0 4px 16px rgba(31, 38, 135, 0.08)',
        'glass-lg': '0 12px 48px rgba(31, 38, 135, 0.15)',
        'primary': '0 4px 14px rgba(26, 86, 219, 0.3)',
        'primary-lg': '0 8px 24px rgba(26, 86, 219, 0.4)',
      },
      backdropBlur: {
        'glass': '12px',
        'nav': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(26, 86, 219, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(26, 86, 219, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}