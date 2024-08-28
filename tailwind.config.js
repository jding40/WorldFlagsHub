/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.html`, `./views/**/*.ejs`],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],

  daisyui: {
    themes: ['fantasy'],
  },
}

