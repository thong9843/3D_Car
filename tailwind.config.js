/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
      keyframes: {
        ping2: { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(3)', opacity: '0' } },
        slideIn: { '0%': { transform: 'translateX(24px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
      },
      animation: { ping2: 'ping2 1.8s cubic-bezier(0,0,0.2,1) infinite', slideIn: 'slideIn .4s ease-out' },
    },
  },
  plugins: [],
};

