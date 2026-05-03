import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./design-system/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
      },
      fontSize: {
        display:   ["3.5rem",   { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        h1:        ["2.5rem",   { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
        h2:        ["2rem",     { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        h3:        ["1.5rem",   { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h4:        ["1.25rem",  { lineHeight: "1.3" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body:      ["1rem",     { lineHeight: "1.55" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption:   ["0.75rem",  { lineHeight: "1.4", letterSpacing: "0.04em" }],
        mono:      ["0.8125rem",{ lineHeight: "1.5" }],
      },
      colors: {
        neutral: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(s => [s, `var(--neutral-${s})`])),
        primary: Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(s => [s, `var(--primary-${s})`])),
        ai:      Object.fromEntries([50,100,200,300,400,500,600,700,800,900].map(s => [s, `var(--ai-${s})`])),
        surface: { page: "var(--surface-page)", card: "var(--surface-card)", raised: "var(--surface-raised)", sunken: "var(--surface-sunken)" },
        border:  { subtle: "var(--border-subtle)", strong: "var(--border-strong)", focus: "var(--border-focus)" },
        text:    { primary: "var(--text-primary)", secondary: "var(--text-secondary)", muted: "var(--text-muted)" },
        success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)",
      },
      spacing: { touch: "44px" },
      borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "28px" },
      boxShadow: {
        1: "var(--shadow-1)", 2: "var(--shadow-2)", 3: "var(--shadow-3)", 4: "var(--shadow-4)",
        focus: "var(--shadow-focus)", "focus-ai": "var(--shadow-focus-ai)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        pulseRing: { "0%": { transform: "scale(1)", opacity: "0.6" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        pulseRing: "pulseRing 1.6s cubic-bezier(0.16,1,0.3,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
