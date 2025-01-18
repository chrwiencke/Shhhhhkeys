/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.{js,css}"
  ],
  safelist: [
    'bg-yellow-100',
    'border-l-4',
    'border-yellow-500',
    'text-yellow-700',
    'invisible',
    'group-hover:visible',
    'bg-gray-700',
    'after:content-[\'\']',
    'after:absolute',
    'after:border-8',
    'after:border-x-transparent',
    'after:border-t-transparent',
    'after:border-b-gray-700'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
