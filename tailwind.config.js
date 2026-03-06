/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rankeao: {
          bg: "#050507",
          panel: "#0a0a0a",
          panelSoft: "#18181b",
          line: "#3f3f46",
          neon: "#f8fafc",
          amber: "#d4d4d8",
          white: "#f8fafc",
          red: "#a1a1aa",
        },
      },
      boxShadow: {
        "neon-red": "0 0 0 1px rgba(248,250,252,0.25), 0 10px 35px rgba(248,250,252,0.22)",
        "neon-amber": "0 0 0 1px rgba(212,212,216,0.25), 0 10px 35px rgba(212,212,216,0.2)",
        "neon-white": "0 0 0 1px rgba(248,250,252,0.2), 0 10px 35px rgba(248,250,252,0.15)",
      },
      fontFamily: {
        heading: ["var(--font-rajdhani)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 15% 15%, rgba(248,250,252,0.28), transparent 38%), radial-gradient(circle at 80% 20%, rgba(248,250,252,0.14), transparent 35%), radial-gradient(circle at 60% 80%, rgba(212,212,216,0.2), transparent 36%)",
      },
    },
  },
  plugins: [],
};
