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
          primary: '#0a4b49',       /* 레벨 1 선택된 딥 에메랄드 */
          primaryHover: '#073b39',
          lightMint: '#daf1ec',     /* 레벨 2 선택된 소프트 민트 */
          mintBorder: '#b3e2d6',
          mintDarkText: '#0a524e',
          badgeBg: '#f1f5f7',
          badgeText: '#64748b'
        }
      }
    },
  },
  plugins: [],
}