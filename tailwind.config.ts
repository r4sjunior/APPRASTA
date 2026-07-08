import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#c81e1e",
          gold: "#e0a72e",
          green: "#1f7a3f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
