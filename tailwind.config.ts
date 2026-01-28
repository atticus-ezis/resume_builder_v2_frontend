import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite-react/lib/**/*.js",
    "./node_modules/flowbite-react/lib/**/*.tsx",
  ],
  darkMode: "class", // Enable class-based dark mode toggle
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    // Note: If you get an error about flowbite/plugin, install flowbite:
    // npm install flowbite
    // For now, flowbite-react should work without the base package
    // require("flowbite/plugin"), // Uncomment if you install flowbite package
  ],
};

export default config;
