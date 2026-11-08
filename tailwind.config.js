/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3182F6',       /* 토스 블루 (Toss Primary Blue) */
          primaryHover: '#1B64DA',  /* 토스 블루 호버 */
          lightMint: '#E8F3FF',     /* 토스 소프트 블루 틴트 */
          mintBorder: '#C9E2FF',
          mintDarkText: '#1B64DA',
          badgeBg: '#F2F4F6',
          badgeText: '#4E5968'
        }
      }
    },
  },
  plugins: [],
}
