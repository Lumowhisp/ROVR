/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#AFDC3A",//Lime Green
        background: "#0D0D0D", // Near Black
        surface: "#E2E2E2",//Light Gray
      },
    },
  },
  plugins: [],
};
