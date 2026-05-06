/** Helpers para ler e escrever a preferência de tema em cookie. */

export const THEME_COOKIE = "visagismo-theme";
export type Theme = "light" | "dark" | "auto";

export function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark" || v === "auto";
}

/** Resolve "auto" → "light" ou "dark" baseado em preferência do sistema. */
export function resolveTheme(theme: Theme, prefersDark: boolean): "light" | "dark" {
  if (theme === "auto") return prefersDark ? "dark" : "light";
  return theme;
}
