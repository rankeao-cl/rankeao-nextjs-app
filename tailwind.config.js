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
          panel: "#0f1017",
          panelSoft: "#151827",
          line: "#2a2f4b",
          neon: "#7c3aed",
          cyan: "#22d3ee",
          red: "#ef4444",
        },
      },
      boxShadow: {
        "neon-purple": "0 0 0 1px rgba(124,58,237,0.25), 0 10px 35px rgba(124,58,237,0.22)",
        "neon-cyan": "0 0 0 1px rgba(34,211,238,0.25), 0 10px 35px rgba(34,211,238,0.2)",
        "neon-red": "0 0 0 1px rgba(239,68,68,0.25), 0 10px 35px rgba(239,68,68,0.2)",
      },
      fontFamily: {
        heading: ["var(--font-rajdhani)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 15% 15%, rgba(124,58,237,0.28), transparent 38%), radial-gradient(circle at 80% 20%, rgba(239,68,68,0.18), transparent 35%), radial-gradient(circle at 60% 80%, rgba(34,211,238,0.2), transparent 36%)",
      },
    },
  },
  plugins: [],
};
