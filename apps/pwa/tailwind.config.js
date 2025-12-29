/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        screens: {
            'xs': '375px',   // Large phones (iPhone X+)
            'sm': '640px',   // Small tablets / large phones landscape
            'md': '768px',   // Tablets portrait
            'lg': '1024px',  // Tablets landscape / small laptops
            'xl': '1280px',  // Desktops
            '2xl': '1536px', // Large desktops
        },
        extend: {},
    },
    plugins: [],
}
