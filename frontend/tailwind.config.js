/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#001674',
        'primary-container': '#1a2e94',
        'primary-fixed': '#d8e2ff',
        'on-primary': '#ffffff',
        'on-primary-fixed-variant': '#1b3264',
        'secondary-fixed': '#d3e4fe',
        'on-secondary-fixed-variant': '#38485d',
        'secondary-container': '#dce2f9',
        'on-secondary-container': '#161b2c',
        tertiary: '#2e0074',
        'tertiary-fixed': '#eaddff',
        'on-tertiary-fixed-variant': '#4a2580',
        surface: '#f7f9fb',
        'surface-container-low': '#f2f4f6',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#dcdfe1',
        'surface-tint': '#3a5ba9',
        'on-surface': '#191c1e',
        'on-surface-variant': '#45464e',
        'outline-variant': '#c4c6cf',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ambient: '0px 20px 40px rgba(25, 28, 30, 0.06)',
      },
      borderRadius: {
        btn: '0.75rem',
      },
    },
  },
  plugins: [],
};
