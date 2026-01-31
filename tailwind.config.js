/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shelfdrop Brand Colors
        'shelfdrop-green': '#A9EC19',
        'shelfdrop-blue': '#0d23c6',
        'shelfdrop-yellow': '#eed404',
        primary: '#A9EC19', // Primary Green
      },
    },
  },
  plugins: [],
}
