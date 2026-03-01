/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          seabank: {
            orange: '#FF5722',
            blue: '#003D79',
            bg: '#F5F7FA',
            text: '#333333'
          }
        }
      },
    },
    plugins: [],
  }