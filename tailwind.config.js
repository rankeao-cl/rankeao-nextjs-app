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
        "3xl": "0.75rem",
        "4xl": "1rem",
        "5xl": "1.25rem",
      },
      boxShadow: {
        "soft-xl": "0 20px 25px -5px oklch(0% 0 0 / 0.1), 0 8px 10px -6px oklch(0% 0 0 / 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-poppins)", "sans-serif"],
        reddit: ["var(--font-reddit)", "sans-serif"],
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 15% 15%, oklch(from var(--brand) l c h / 0.15), transparent 38%), radial-gradient(circle at 80% 20%, oklch(from var(--accent) l c h / 0.1), transparent 35%)",
      },
    },
  },
  plugins: [],
};
