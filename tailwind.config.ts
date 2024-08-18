import { Config } from 'tailwindcss';

const tailwindConfig: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      keyframes: {
        rotation: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        rotationReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        'spin-slow': 'rotation 1s linear infinite',
        'spin-slow-reverse': 'rotationReverse 0.5s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      borderWidth: {
        '4': '4px',
      },
      // borderColor: (theme: (key: string) => any) => ({
      //   'custom-white': '#FFF',
      //   'custom-orange': '#FF3D00',
      //   ...theme('colors'),
      // }),
      colors: {
        neutral: {
          5: '#F9F9F9',
          10: '#F5F5F5',
          20: '#EFEFEF',
          30: '#E8E8E8',
          40: '#E0E0E0',
          50: '#D9D9D9',
          60: '#A6A9AA',
          70: '#939393',
          80: '#121723',
          90: '#313237',
        },
        primary: {
          5: '#F9FBFD',
          10: '#F3F8FF',
          20: '#E4E9F1',
          30: '#C8CED8',
          40: '#8993A4',
          50: '#505F7A',
          60: '#374F76',
          70: '#243858',
          80: '#f0f0f5',
          90: '#1055c4',
        },
        warning: {
          5: '#FFF9F9',
          10: '#F7EFF0',
          20: '#F0E0E1',
          30: '#E4C9CA',
          40: '#D8B2B3',
          50: '#C58B8E',
          60: '#BB777A',
          70: '#B26468',
          80: '#8E5053',
          90: '#6B3C3E',
        },
        shades: {
          white: `#FFFFFF`,
          black: `#000000`,
        },
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
