/**
 * Build configuration file for the frontend: tailwind.config.
 * It tunes the toolchain that compiles, bundles or styles the app.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors — identidad del club, no modificar
        brand: {
          orange: '#FE6128',
          blue:   '#75A8E0',
          green:  '#3AAA35',
          white:  '#FDFFFF',
          black:  '#000000',
          grey:   '#9F9CA5',
        },
        // State colors
        state: {
          success: '#22C55E',
          error:   '#EF4444',
          warning: '#F59E0B',
          info:    '#1E3A8A',
        },
      },
      fontFamily: {
        'bebas':     ['BebasNeue_400Regular'],
        'inter':     ['Inter_400Regular'],
        'inter-500': ['Inter_500Medium'],
        'inter-600': ['Inter_600SemiBold'],
        'inter-700': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
