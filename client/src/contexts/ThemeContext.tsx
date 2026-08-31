import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system" }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("velora-theme") as Theme) || defaultTheme);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
    localStorage.setItem("velora-theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(current => current === "dark" ? "light" : "dark") }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
