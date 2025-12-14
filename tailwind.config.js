/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
          900: '#1A1A1A', // Text strong
          700: '#4F4F4F', // Text medium
          500: '#828282', // Text muted, placeholders
          300: '#D1D1D1', // Borders (light)
          200: '#E6E9EE', // Dividers, thin borders
          100: '#F7FAFC', // Backgrounds
          50: '#FFFFFF', // Surface
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
      // Typography Sizes (reduced by 10%)
      fontSize: {
        h1: ['29px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '29px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '25px', fontWeight: '600' }],
        h4: ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '25px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-xs': ['11px', { lineHeight: '14px', fontWeight: '400' }],
        button: ['14px', { lineHeight: '18px', fontWeight: '600' }],
      },
      // Spacing Scale (reduced by 10%)
      spacing: {
        4: '3.6px',
        8: '7.2px',
        12: '10.8px',
        16: '14.4px',
        24: '21.6px',
        32: '28.8px',
        40: '36px',
        48: '43.2px',
      },
      // Border Radius (reduced by 10%)
      borderRadius: {
        DEFAULT: '7.2px',
        button: '7.2px',
        card: '9px',
        input: '7.2px',
        lg: '9px',
        xl: '10.8px',
      },
      // Custom Shadows - Clinic Theme
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 2px 4px rgba(0,0,0,0.06)',
        lg: '0 4px 12px rgba(0,0,0,0.08)',
        xl: '0 8px 20px rgba(0,0,0,0.12)',
        // Focus shadow for inputs
        focus: '0 0 0 3px rgba(45,156,219,0.20)',
      },
    },
  },
  plugins: [],
};
export default config;
