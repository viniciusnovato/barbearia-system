import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./design-system-v2/**/*.{ts,tsx,html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Tudo Inter — single family, peso varia.
        // Mantém `display` separado pra facilitar troca futura sem refator.
        display: ["Inter", "InterVariable", "Söhne", "system-ui", "sans-serif"],
        sans: ["Inter", "InterVariable", "Söhne", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "SF Mono", "Menlo", "monospace"],
      },
      fontSize: {
        display:   ["2.5rem",   { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        h1:        ["2rem",     { lineHeight: "1.2",  letterSpacing: "-0.015em" }],
        h2:        ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.01em"  }],
        h3:        ["1.25rem",  { lineHeight: "1.3"  }],
        h4:        ["1.0625rem",{ lineHeight: "1.35" }],
        "body-lg": ["1rem",     { lineHeight: "1.55" }],
        body:      ["0.9375rem",{ lineHeight: "1.5"  }],
        "body-sm": ["0.8125rem",{ lineHeight: "1.5"  }],
        caption:   ["0.75rem",  { lineHeight: "1.4", letterSpacing: "0.02em"   }],
        mono:      ["0.8125rem",{ lineHeight: "1.5"  }],
      },
      colors: {
        neutral: {
          0:   "var(--neutral-0)",
          50:  "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          950: "var(--neutral-950)",
        },
        primary: {
          50:  "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          950: "var(--primary-950)",
        },
        accent: {
          50:  "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        // Mantemos `ai` como alias do accent — código legado continua compilando.
        ai: {
          50:  "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        surface: {
          page:   "var(--surface-page)",
          card:   "var(--surface-card)",
          raised: "var(--surface-raised)",
          sunken: "var(--surface-sunken)",
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          focus:  "var(--border-focus)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
        },
        status: {
          empty:     { bg: "var(--status-empty-bg)",     fg: "var(--status-empty-fg)",     ring: "var(--status-empty-ring)" },
          suggested: { bg: "var(--status-suggested-bg)", fg: "var(--status-suggested-fg)", ring: "var(--status-suggested-ring)" },
          edited:    { bg: "var(--status-edited-bg)",    fg: "var(--status-edited-fg)",    ring: "var(--status-edited-ring)" },
          approved:  { bg: "var(--status-approved-bg)",  fg: "var(--status-approved-fg)",  ring: "var(--status-approved-ring)" },
          conflict:  { bg: "var(--status-conflict-bg)",  fg: "var(--status-conflict-fg)",  ring: "var(--status-conflict-ring)" },
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger:  "var(--danger)",
      },
      spacing: {
        1: "4px",  2: "8px",  3: "12px", 4: "16px",
        5: "20px", 6: "24px", 7: "32px", 8: "48px", 9: "64px",
        touch: "44px",
      },
      borderRadius: {
        sm:    "4px",
        md:    "6px",
        lg:    "8px",
        xl:    "12px",
        "2xl": "16px",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        4: "var(--shadow-4)",
        focus: "var(--shadow-focus)",
        "focus-ai": "var(--shadow-focus-ai)",
      },
      transitionTimingFunction: {
        out:      "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        fast: "100ms",
        base: "160ms",
        slow: "260ms",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        progressSlide: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "0.6" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        shimmer:      "shimmer 1.6s linear infinite",
        progressSlide:"progressSlide 1.4s cubic-bezier(0.65,0,0.35,1) infinite",
        pulseRing:    "pulseRing 1.4s var(--ease-out) infinite",
        spin:         "spin 0.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
