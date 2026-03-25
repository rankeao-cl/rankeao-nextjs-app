/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos — se mapean a variables CSS del tema
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-solid": "var(--surface-solid)",
        "surface-solid-secondary": "var(--surface-solid-secondary)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        brand: "var(--brand)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        purple: "var(--purple)",
        orange: "var(--orange)",
        pink: "var(--pink)",
        yellow: "var(--yellow)",
        "code-bg": "var(--code-bg)",
        "code-fg": "var(--code-fg)",
        // Alias legacy para retrocompatibilidad
        rankeao: {
          bg: "var(--background)",
          surface: "var(--surface)",
          panel: "var(--surface-secondary)",
          line: "var(--border)",
          neon: "var(--foreground)",
          amber: "var(--accent)",
          white: "#ffffff",
          red: "var(--danger)",
        },
      },
      borderRadius: {
        "card": "22px",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "soft-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-poppins)", "sans-serif"],
        reddit: ["var(--font-reddit)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
