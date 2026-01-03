import { Config } from 'tailwindcss';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}" // catch App.tsx in root
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
            },
            colors: {
                cream: {
                    50: '#FDFBF7',
                    100: '#F7F3EB',
                    200: '#EBE5D5',
                },
                warm: {
                    500: '#8C7B6C',
                    700: '#5D5752',
                    900: '#433D38',
                },
                soft: {
                    yellow: '#FAE5C7',
                    gold: '#E6C288',
                    goldHover: '#D4B076',
                }
            },
            boxShadow: {
                'float': '0 10px 30px -10px rgba(93, 87, 82, 0.15)',
                'soft': '0 4px 12px rgba(93, 87, 82, 0.08)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
} satisfies Config;
