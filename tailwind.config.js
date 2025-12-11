/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Color System - Clinic Theme
      colors: {
        primary: {
          900: '#0B67A0',
          700: '#0F89C7',
          500: '#2D9CDB',
          300: '#56CCF2',
          100: '#E6F7FE',
        },
        secondary: {
          700: '#1E874F',
          500: '#27AE60',
          300: '#6FCF97',
          100: '#E8F8EF',
        },
        neutral: {
          900: '#1A1A1A',  // Text strong
          700: '#4F4F4F',  // Text medium
          500: '#828282',  // Text muted, placeholders
          300: '#D1D1D1',  // Borders (light)
          200: '#E6E9EE',  // Dividers, thin borders
          100: '#F7FAFC',  // Backgrounds
          50: '#FFFFFF',   // Surface
        },
        status: {
          success: '#27AE60',
          warning: '#F2C94C',
          error: '#EB5757',
          info: '#2D9CDB',
        },
      },
      // Typography - Inter Font Family
      fontFamily: {
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Roboto"',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      // Typography Sizes
      fontSize: {
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: '20px', fontWeight: '600' }],
      },
      // Spacing Scale
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
      },
      // Border Radius
      borderRadius: {
        'button': '8px',
        'card': '10px',
        'input': '8px',
      },
      // Custom Shadows - Clinic Theme
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 2px 4px rgba(0,0,0,0.06)',
        'lg': '0 4px 12px rgba(0,0,0,0.08)',
        'xl': '0 8px 20px rgba(0,0,0,0.12)',
        // Focus shadow for inputs
        'focus': '0 0 0 3px rgba(45,156,219,0.20)',
      },
    },
  },
  plugins: [],
};
export default config;
